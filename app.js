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
                  url: 'https://api-content.dropbox.com/1/files_put/auto/zendesk/ZENDESK/pdf/' + fileName + '?overwrite=false', // modify this URL to the correct path per dropbox user - could be different for each one
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
            'app.created': 'reload',
            'comment.attachments.changed': 'reload',
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
            'uploadFile.always': 'uploadFileDone' // using 'always' as the .done is not firing consistently
            // 'uploadFile.fail': 'uploadFileFail'
        },

        reload: function(e) {
          var interval = setInterval(function() {
            var attachments = this.comment().attachments();
            // if they all have URLs clearTimeout and call this.load()
            var urls = _.map(attachments, function(attachment) {
              var url = attachment.contentUrl();
              var bool;
              if(url) {
                bool = true;
              } else {
                bool = false;
              }
              return bool;
            });

            var allLoaded = !_.contains(urls, false);
            var oneLoaded = _.contains(urls, true);
            if(allLoaded) { // all attachments loaded
              clearInterval(interval);
              this.getAttachments(true);
            } else {
              this.getAttachments(false);
            }
          }.bind(this), 100);
        },

        getAttachments: function(complete) {
            this.switchTo('loading');

            if (complete === true) {

                var attachmentsArray            = [],
                    ticket                      = this.ticket(),
                    comment                     = this.comment(),
                    currentCommentAttachments   = comment.attachments();

            // Get all attachments on CURRENT COMMENT & filter to only PDFs
                if (currentCommentAttachments.length > 0) {
                  for (var i = 0; currentCommentAttachments.length > i; i++) {   
                    if (currentCommentAttachments[i].contentType() === 'application/pdf') {
                        // // Testing start
                        // console.log(currentCommentAttachments[i].contentUrl());
                        // // Testing end
                        attachmentsArray.push(currentCommentAttachments[i].contentUrl());
                    }
                  }
                }

            // Get all attachments on the every single comment EXCEPT CURRENT COMMENT & filter to only PDFs
                ticket.comments().forEach(function(comment) {
                    var firstImageAttachment    = comment.imageAttachments().get(0),
                        firstNonImageAttachment = comment.nonImageAttachments()[0];

                    if (firstImageAttachment !== undefined ) {
                      if (firstImageAttachment.contentType() === 'application/pdf') {
                        attachmentsArray.push(firstImageAttachment.contentUrl());
                      }
                    }

                    if (firstNonImageAttachment !== undefined ) {
                      if (firstNonImageAttachment.contentType() === 'application/pdf') {
                        attachmentsArray.push(firstNonImageAttachment.contentUrl());
                      }
                    }
                });
                // TODO handle the 'complete' variable
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
            } else {
                console.log('Current comment attachments upload in progress');
            }
        },

        lookForBearerToken: function () {
            // console.log('lookForBearerToken');

            this.switchTo('loading');

            if (this.store('OAuth Bearer Token') === null) { // Not signed in to Dropbox
                // console.log('lookForBearerToken IF');
                services.notify('<span style="font-size: 14px;">Please click <strong>allow</strong> in the popup then <strong>copy the code into the app</strong> to continue</span>', 'alert', 4000);
                this.switchTo('inputCode');
                this.createLoginPopup(); // Display OAuth 'allow' popup
            } else { // Already signed in to Dropbox - send PDFs now
                // console.log('lookForBearerToken ELSE');
                var bearer_token                        = this.store('OAuth Bearer Token'),
                    attachmentsArray                    = this.attachmentsArray,
                    // firstAttachmentInAttachmentsArray   = attachmentsArray[0],
                    // url                                 = firstAttachmentInAttachmentsArray,
                    attachmentsArraySize                = this.attachmentsArraySize;

                services.notify('Sending files to Dropbox, just a moment', 'notice');

                // loop through each item in attachmentsArray and send each *.contentUrl() to this.created as 'url'
                for (var i = 0; attachmentsArray.length > i; i++) {
                    var url = attachmentsArray[i];
                    // console.log(url);
                    this.created(url, bearer_token, attachmentsArraySize);
                }
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
          // console.log('processInputValue');
          services.notify('Signing in to Dropbox, please wait', 'notice');
          var code = this.$('input#inputValueId').val(); // Variable set to value entered into input field
          this.switchTo('loading');
          
          this.ajax('getBearerToken', code) // API Call to Dropbox to get the Bearer Token
            .done(function(data){
                this.switchTo('loading');
                services.notify('Signed in to Dropbox', 'notice');
                this.token = data.access_token; // Set 'Bearer Token' to this
                var bearer_token = this.token;
                this.store('OAuth Bearer Token', bearer_token); // Store Bearer token in localStorage
                var attachmentsArray                    = this.attachmentsArray, // Get attachmentsArray from this
                    // firstAttachmentInAttachmentsArray   = attachmentsArray[0],
                    // url                                 = firstAttachmentInAttachmentsArray,
                    attachmentsArraySize                = this.attachmentsArraySize;

                services.notify('Sending files to Dropbox, just a moment', 'notice');

                // loop through each item in attachmentsArray and send each *.contentUrl() to this.created as 'url'
                for (var i = 0; attachmentsArray.length > i; i++) {
                    var url = attachmentsArray[i];
                    console.log(url);
                    this.created(url, bearer_token, attachmentsArraySize);
                }
            })
            .fail(function(data){ // Failed to get Bearer token from Dropbox
                this.switchTo('authFail');
                services.notify('Problem signing in to Dropbox', 'error');
                console.error('OAuth request failed - could not get Bearer Token. Dropbox response: HTTP ' + data.status + ' ' + data.statusText);
            });

          code = this.$('input#inputValueId').val(''); // Empties input field 
        },

        created: function(url, bearer_token, attachmentsArraySize) { 
        // ( From @jstjoe - https://gist.github.com/jstjoe/fe4f2ebd9e5c3c562143 )
        // Transform *.contentURL() into data to send with upload request to Dropbox
            
            // debugging logs start
            console.log('url:');
            console.log(url);
            // debugging logs end

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';

            xhr.onload = function(e) {
                if (xhr.status == 200) {
                    var url = URL.createObjectURL( xhr.response );
                    console.log(url);
                    var file    = xhr.response,
                        fd      = new FormData();
                    fd.append('data', file);
                    this.ajax('uploadFile', fd, 'test.pdf', bearer_token).done(function(response) {
                        console.log('File uploaded!');
                  });
                }
            }.bind(this);
            
            xhr.onerror = function () { 
                console.error(xhr, xhr.status); 
            };

            xhr.send();
            this.switchTo('loading');
        },

        uploadFileDone: function(data) {
            this.attachmentsArraySize = this.attachmentsArraySize-1;
            
            var attachmentsArraySize        = this.attachmentsArraySize,
                attachmentsArraySizeAnchor  = this.attachmentsArray.length;

            if (attachmentsArraySize === 0) {
                services.notify('Files sent to Dropbox successfully', 'notice');
                this.switchTo('filesSentSuccess', {
                    PDFcount: this.attachmentsArray.length
                });
            }
        },

        uploadFileFail: function(data) {
            services.notify('Error sending files to Dropbox, please try again', 'error', 8000);
            this.switchTo('filesSentFail', {
                PDFcount: this.attachmentsArray.length
            });
            console.error('Request to send files to Dropbox failed');
        }
    };
}(this));