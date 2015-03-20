/*global Blob*/
/*global URL*/
/*global File*/
/*global FileReader*/
/*global XMLHttpRequest*/
/*global FormData*/
(function (window) {
    var attachmentsArray = [];

    return {
    
        requests: {
    
            getBearerToken: function (code) {
                return {
                    url: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&client_id=wlaohmc8nkj7og4&client_secret=as7blmehog1jtdz',
                    dataType: 'json',
                    type: 'POST'
                };
            },
    
            uploadFile: function (data, fileName, bearer_token) { // SEND REQUEST TO UPLOAD 1 PDF TO DROPBOX
                // var bearer_token = '{redacted}';
                return {
                  url: 'https://api-content.dropbox.com/1/files_put/auto/ZENDESK/' + fileName + '?overwrite=false',
                  accepts: 'text/plain; charset=iso-8859-1',
                  headers: {
                    "Authorization": 'Bearer ' + bearer_token,
                    "Content-Type": "text/plain; charset=iso-8859-1"
                  },
                  type: 'PUT',
                  data: data,
                  processData: false,
                  contentType: false
                };
            }
        },

        events: {
          //LIFECYCLE events//
            'app.created': 'init',
            'comment.attachments.changed': 'init',
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
            'uploadFile.always': 'uploadFileDone'
            // 'uploadFile.fail': 'uploadFileFail'
        },

        init: function() {
            this.switchTo('loading');
            var attachmentsArray            = [],
                ticket                      = this.ticket(),
                comment                     = this.comment(),
                currentCommentAttachments   = comment.attachments(); // Attachments - CURRENT COMMENT

            if (currentCommentAttachments.length > 0) {
                for (var i = 0; currentCommentAttachments.length > i; i++) {
                    if (currentCommentAttachments[i].contentType() === 'application/pdf') {
                        // console.log('PDF - ATTACHMENT');
                        attachmentsArray.push(currentCommentAttachments[i].contentUrl());
                    }
                }
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
                    }

                    if (firstNonImageAttachment !== undefined ) {
                        // console.log(firstNonImageAttachment);
                        if (firstNonImageAttachment.contentType() === 'application/pdf') {
                            // console.log('PDF - ATTACHMENT');
                            attachmentsArray.push(firstNonImageAttachment.contentUrl());
                        }
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
            // console.log('this.attachmentsArray:');
            // console.log(this.attachmentsArray);
            // console.log('this.attachmentsArraySize:');
            // console.log(this.attachmentsArraySize);
        },

        lookForBearerToken: function () {
            this.switchTo('loading');
            if (this.store('OAuth Bearer Token') === null) { // Not signed in to Dropbox yet
                // this.switchTo('loading');
                services.notify('<span style="font-size: 14px;">Please click <strong>allow</strong> in the popup then <strong>copy the code into the app</strong> to continue</span>', 'alert', 4000);
                this.switchTo('inputCode');
                this.createLoginPopup(); // Display OAuth popup to click allow & copy paste auth code to input field
            } else { // There is a Bearer Token already in localStorage - so send test attachments immediately
                var bearer_token                        = this.store('OAuth Bearer Token'), // Get Bearer token from localStorage
                    attachmentsArray                    = this.attachmentsArray, // Get attachmentsArray from this
                    firstAttachmentInAttachmentsArray   = attachmentsArray[0],
                    url                                 = firstAttachmentInAttachmentsArray,
                    attachmentsArraySize                = this.attachmentsArraySize;
                
                services.notify('Sending files to Dropbox, just a moment', 'notice');
                this.created(url, bearer_token, attachmentsArraySize);

                console.log('url:');
                console.log(url);
                console.log('bearer_token:');
                console.log(bearer_token);
                console.log('this.attachmentsArraySize:');
                console.log(this.attachmentsArraySize);

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
                var firstAttachmentInAttachmentsArray   = attachmentsArray[0],
                    url                                 = firstAttachmentInAttachmentsArray,
                    attachmentsArraySize                = this.attachmentsArraySize;

                services.notify('Sending files to Dropbox, just a moment', 'notice');
                this.created(url, bearer_token, attachmentsArraySize);

                console.log('url:');
                console.log(url);
                console.log('bearer_token:');
                console.log(bearer_token);
                console.log('this.attachmentsArraySize:');
                console.log(this.attachmentsArraySize);

            })
            .fail(function(data){ // Failed to get Bearer token from Dropbox
                this.switchTo('authFail');
                services.notify('Problem signing in to Dropbox', 'error');
                console.error('OAuth request failed - could not get Bearer Token. Dropbox response: HTTP ' + data.status + ' ' + data.statusText);
            });

          code = this.$('input#inputValueId').val(''); // Empties input field 
        },

// From @jstjoe - https://gist.github.com/jstjoe/fe4f2ebd9e5c3c562143
        created: function(url, bearer_token, attachmentsArraySize) {
        // Transform *.contentURL() into data to send with upload request to Dropbox
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.responseType = 'blob';
     
          xhr.onload = function(e) {

            if (xhr.status == 200) {
              var url = URL.createObjectURL( xhr.response );
                  console.log( url );
              var file = xhr.response;
              var fd = new FormData();
              fd.append('data', file);
              this.ajax('uploadFile', fd, 'test.pdf', bearer_token).done(function(response) {
                // console.dir(r);
                console.log('File uploaded!');
              });
            }
          }.bind(this);
     
          xhr.send();

          this.switchTo('loading');
        },

        uploadFileDone: function(data) {
        // Handle response from Dropbox [*.done]
            services.notify('Files sent to Dropbox successfully', 'notice');
            this.switchTo('filesSentSuccess', {
                PDFcount: this.attachmentsArraySize
            });
        },

        uploadFileFail: function(data) {
        // Handle response from Dropbox [*.fail]
            services.notify('Failed sending files to Dropbox, please try again', 'error');
            this.switchTo('filesSentFail', {
                PDFcount: this.attachmentsArraySize
            });
            console.error('Request to send files to Dropbox failed');
        }
    };
}(this));