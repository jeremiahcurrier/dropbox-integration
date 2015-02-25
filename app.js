(function (window) {

    var attachmentsArray = [];

    return {

        ////////////////
        /// REQUESTS ///
        ////////////////

        requests: {
            getBearerToken: function (code) {
                return {
                    url: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&client_id=wlaohmc8nkj7og4&client_secret=as7blmehog1jtdz',
                    dataType: 'json',
                    type: 'POST'
                };
            },

            sendFilesToDropbox: function (bearer_token) {

                console.log(bearer_token);

                return {
                    // url: 'https://api-content.dropbox.com/1/files_put/auto/<path>?param=val',
                    url: 'http://requestb.in/138vlx91',
                    dataType: 'json',
                    type: 'PUT',
                    contentType: 'application/json',
                    headers: {
                        "Authorization": ' Bearer ' + bearer_token
                    }
                };
            }
        },

        ////////////////
        //// EVENTS ////
        ////////////////

        events: {
            //LIFECYCLE events//
            'app.created': 'init',
            'comment.attachments.changed': 'init',
            'ticket.submit.always': 'init',
            //DOM events//
            'click .upload': 'lookForBearerToken',
            'click .getCode': function(event){
                this.switchTo('inputCode');
                this.createLoginPopup();
            },
            'keyup #inputValueId': function(event){
              if(event.keyCode === 13)
                return this.processInputValue();
            },
            'click .start_over': 'init',
            //AJAX events//
            // 'getBearerToken.done': 'getBearerTokenSuccess',
            // 'getBearerToken.fail': 'getBearerTokenFail',
            'sendFilesToDropbox.always': 'filesSentSuccess' // Switch this to '.done' in the future
            // 'sendFilesToDropbox.fail': 'filesSentFail'
        },

        /////////////////
        /// FUNCTIONS ///
        /////////////////

        init: function() {
            this.switchTo('loading');
            var attachmentsArray = [];
            var ticket = this.ticket();

            // Attachments - CURRENT COMMENT
            var comment                     = this.comment(),
                currentCommentAttachments   = comment.attachments();

            if (currentCommentAttachments.length > 0) {
                for (var i = 0; currentCommentAttachments.length > i; i++) {
                    if (currentCommentAttachments[i].contentType() === 'application/pdf') {
                        // console.log('PDF - ATTACHMENT');
                        attachmentsArray.push(currentCommentAttachments[i].contentUrl());
                    }
                }
            } else {
                // console.log('No attachments on current comment');
            }

            // Attachments - ALL COMMENTS EXCEPT CURRENT COMMENT
            ticket.comments().forEach(function(comment) {
                var firstImageAttachment    = comment.imageAttachments().get(0),
                    firstNonImageAttachment = comment.nonImageAttachments()[0];

                    if (firstImageAttachment !== undefined ) {
                        // console.log(firstImageAttachment);
                        if (firstImageAttachment.contentType() === 'application/pdf') {
                            // console.log('PDF - ATTACHMENT');
                            attachmentsArray.push(firstImageAttachment.contentUrl());
                        }
                    } else {
                        // console.log('no image attachments for comment id: ' + comment.id());
                    }

                    if (firstNonImageAttachment !== undefined ) {
                        // console.log(firstNonImageAttachment);
                        if (firstNonImageAttachment.contentType() === 'application/pdf') {
                            // console.log('PDF - ATTACHMENT');
                            attachmentsArray.push(firstNonImageAttachment.contentUrl());
                        }
                    } else {
                        // console.log('no non-image attachments for comment id: ' + comment.id());
                    }
            });

            if (attachmentsArray.length === 0) {
                this.switchTo('noAttachments', {
                    PDFcount: attachmentsArray.length
                });
            } else {
                this.switchTo('sendFiles', {
                    PDFcount: attachmentsArray.length
                });
            }

            this.attachmentsArray = attachmentsArray;
            this.attachmentsArraySize = attachmentsArray.length;

        },

        lookForBearerToken: function () {

            this.switchTo('loading');
            // Check localStorage for Bearer Token
// ****************** FIGURE OUT HOW TO KEEP BEARER TOKEN IN LOCALSTORAGE ************
            if (1 > 0) { 
                // Code below if you don't yet have a bearer_token
                services.notify('Please sign in to continue', 'alert');
                this.switchTo('login');
            } else {
                // Code below only if there is a bearer_token
                // var bearer_token = this.token;
                // this.ajax('sendFilesToDropbox', bearer_token);
                // console.log('token:');
                // console.log(token);
                // console.log('sending request to Dropbox');
                console.log('you must already have an active oauth bearer_token');
                console.log('******lookForBearerToken****  this.attachmentsArraySize:');
                console.log(this.attachmentsArraySize);
                this.switchTo('filesSentSuccess', {
                    PDFcount: this.attachmentsArraySize
                });
            }

        },

        filesSentSuccess: function(data) {
            services.notify('PDF(s) sent to Dropbox!', 'notice');
            this.switchTo('filesSentSuccess', {
                PDFcount: this.attachmentsArraySize
            });
        },

        // filesSentFail: function(data) {
        //     console.log(data);
        //     this.switchTo('filesSentFail');
        //     console.log('/// *******[DROPBOX APP ERROR - start]******* ///');
        //     console.log('Request to send files to Dropbox failed - that\'s all we know');
        //     console.log('/// *******[DROPBOX APP ERROR - end]******* ///');
        // },

        createLoginPopup: function () {
            return window.open( 
                // [SECURITY VULNERABILITY] Future version will include 'state' parameter to mitigate CSRF risks
                'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=wlaohmc8nkj7og4',
                'Login Popup',
                'width=650,height=480,left=400,top=100'
            );
        },

        // Send request to Dropbox for the Bearer Token
        processInputValue: function() {
          var code = this.$('input#inputValueId').val();
          this.switchTo('loading');
          
          this.ajax('getBearerToken', code)
            .done(function(data){
                services.notify('You have been signed in to Dropbox!', 'notice');
                this.switchTo('sendFiles', {
                    PDFcount: this.attachmentsArraySize
                });
                
                this.token = data.access_token; // Bind 'Bearer Token' to app root
                var bearer_token = this.token;
                
                this.ajax('sendFilesToDropbox', bearer_token);
                
                this.switchTo('loading');
            })
            .fail(function(data){
                this.switchTo('authFail');
                services.notify('Problem signing in to Dropbox', 'error');
                console.log('/// *******[DROPBOX APP ERROR - start]******* ///');
                console.log('OAuth request failed - could not get Bearer Token. Dropbox response: HTTP ' + data.status + ' ' + data.statusText);
                console.log('/// *******[DROPBOX APP ERROR - end]******* ///');
            });
          
          // Line of code below removes the code from the input field after you have clicked 'Enter' on the keyboard
          code = this.$('input#inputValueId').val('');
        }

    };
}(this));