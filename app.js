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

            createTestFileInDropbox: function(bearer_token, firstAttachmentInAttachmentsArray) {
                return {
                    url: 'https://api-content.dropbox.com/1/files_put/auto/ZENDESK/attachments.txt?overwrite=false',
                    // https://api-content.dropbox.com/1/files_put/auto/<path>/<to>/<file>
                    // url: 'http://requestb.in/sxa0ndsx',
                    dataType: 'json',
                    type: 'PUT',
                    contentType: 'text/plain',
                    headers: {
                        "Authorization": 'Bearer ' + bearer_token
                    },
                    data: firstAttachmentInAttachmentsArray
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
            // 'sendFilesToDropbox.always': 'filesSentSuccess' // Switch this to '.done' in the future
            // 'sendFilesToDropbox.fail': 'filesSentFail'
            'createTestFileInDropbox.done': 'createTestFileInDropboxDone',
            'createTestFileInDropbox.fail': 'createTestFileInDropboxFail'
            // 'createTestFileInDropbox.always': 'createTestFileInDropboxAlways'
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

            console.log('this.attachmentsArray:');
            console.log(this.attachmentsArray);
            console.log('this.attachmentsArraySize:');
            console.log(this.attachmentsArraySize);

        },

        lookForBearerToken: function () {
            this.switchTo('loading');
            if (this.store('OAuth Bearer Token') === null) { // A value has NOT been set for the Bearer Token
                // this.switchTo('loading');
                services.notify('Please click <strong>allow</strong> in the popup then <strong>copy the code into the app</strong> to continue', 'alert', 3500);
                this.switchTo('inputCode');
                this.createLoginPopup(); // Display popup to click allow & copy paste auth code to input field
            } else { // There is a Bearer Token already in localStorage - so send test attachments immediately
                var bearer_token        = this.store('OAuth Bearer Token'), // Get Bearer token from localStorage
                    attachmentsArray    = this.attachmentsArray; // Get attachmentsArray from this
                services.notify('Sending files to Dropbox, just a moment', 'notice');




                // console.log('attachmentsArray:');
                // console.log(attachmentsArray);
                console.log('attachmentsArray:');
                console.log(attachmentsArray);
                var firstAttachmentInAttachmentsArray = attachmentsArray[0];

// *****   GET ATTACHMENTS IN THERE    *********************************************
                this.ajax('createTestFileInDropbox', bearer_token, firstAttachmentInAttachmentsArray); // API call to create test file in Dropbox




            }
        },

        createLoginPopup: function () {
            return window.open( 
                // 'redirect_uri' optional according to Dropbox's OAuth 2 documentation
                'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=wlaohmc8nkj7og4', // Add 'state' parameter
                'Login Popup',
                'width=650,height=480,left=400,top=100'
            );
        },

        processInputValue: function() {
          var code = this.$('input#inputValueId').val(); // Variable set to value entered into input field
          this.switchTo('loading'); // Switch to loading page
          services.notify('Signing in to Dropbox, please wait', 'notice');
          
              this.ajax('getBearerToken', code) // API Call to Dropbox to get the Bearer Token
                .done(function(data){
                    this.switchTo('loading');
                    services.notify('Signed in to Dropbox', 'notice');
                    this.token = data.access_token; // Set 'Bearer Token' to this
                    var bearer_token = this.token;
                    this.store('OAuth Bearer Token', bearer_token); // Store Bearer token in localStorage
                    services.notify('Sending files to Dropbox, just a moment', 'notice');





                // console.log('attachmentsArray:');
                // console.log(attachmentsArray);
                console.log('attachmentsArray:');
                console.log(attachmentsArray);
                var firstAttachmentInAttachmentsArray = attachmentsArray[0];

// *****   GET ATTACHMENTS IN THERE    *********************************************
                this.ajax('createTestFileInDropbox', bearer_token, firstAttachmentInAttachmentsArray); // API call to create test file in Dropbox





                })
                .fail(function(data){ // Failed to get Bearer token from Dropbox
                    this.switchTo('authFail');
                    services.notify('Problem signing in to Dropbox', 'error');
                        // Debugging logs
                        console.log('/// *******[DROPBOX APP ERROR - start]******* ///');
                        console.log('OAuth request failed - could not get Bearer Token. Dropbox response: HTTP ' + data.status + ' ' + data.statusText);
                        console.log('/// *******[DROPBOX APP ERROR - end]******* ///');
                });
          code = this.$('input#inputValueId').val(''); // Empties input field 
        },

        createTestFileInDropboxDone: function() {
            // Handle response from Dropbox [*.done]
            services.notify('Files sent to Dropbox successfully', 'notice');
            this.switchTo('filesSentSuccess', {
                PDFcount: this.attachmentsArraySize
            });
        },

        createTestFileInDropboxFail: function(data) {
            // Handle response from Dropbox [*.fail]
            services.notify('Failed sending files to Dropbox, please try again', 'error');
            this.switchTo('filesSentFail', {
                PDFcount: this.attachmentsArraySize
            });
                // Debugging logs
                console.log('/// *******[DROPBOX APP ERROR - start]******* ///');
                console.log('Request to send files to Dropbox failed - that\'s all we know');
                console.log('/// *******[DROPBOX APP ERROR - end]******* ///');
        }

    };
}(this));