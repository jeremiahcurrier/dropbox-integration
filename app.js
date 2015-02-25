(function (window) {

    var attachments = [];

    return {

        ////////////////
        /// REQUESTS ///
        ////////////////

        requests: {
            getBearerToken: function (code) {
                return {
                    url: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&client_id=wlaohmc8nkj7og4&client_secret=as7blmehog1jtdz',
                    dataType: 'json',
                    type: 'POST',
                    proxy_v2: true
                };
            }
        },

        ////////////////
        //// EVENTS ////
        ////////////////

        events: {
            //LIFECYCLE events//
            'app.created': 'init',
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
            //AJAX events//
            'getBearerToken.done': 'displayBearerToken',
            'getBearerToken.fail': 'displayBearerTokenFail'
        },

        /////////////////
        /// FUNCTIONS ///
        /////////////////

        init: function() {
            this.switchTo('sendFiles');
        },

        lookForBearerToken: function () {

            this.switchTo('loading');
            // Check localStorage for Bearer Token

            if (1 > 0) { // You don't have a Bearer Token yet
                services.notify('You\'ll need to sign in to Dropbox first to send the attachments', 'alert');
                this.switchTo('login');
            } else { // You have the Bearer Token - so now you need to get the attachments on the ticket
                this.getAllCurrentTicketAttachments();
            }

        },

        getAllCurrentTicketAttachments: function() {
            // Once this function gets all the ticket attachments then send request to Dropbox to upload files
            alert('function does nothing right now');
            // code to get attachments
            // store attachments
            // Make request to Dropbox - pass Bearer Token in to request
        },

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
          this.ajax('getBearerToken', code);
          
          // Line of code below removes the code from the input field after you have clicked 'Enter' on the keyboard
          var code = this.$('input#inputValueId').val('');
          this.switchTo('loading');
        },

        displayBearerToken: function(data) {
            console.log('Dropbox OAuth 2.0 Bearer Token: ' + data.access_token);
            services.notify('You have been signed in to Dropbox!', 'notice');
            this.switchTo('sendFiles');
            // this.switchTo('sendFiles', {
            //     bearer_token: data.access_token
            // });
        },

        displayBearerTokenFail: function(data) {
            this.switchTo('authFail');
            services.notify('Problem signing in to Dropbox', 'error');
            console.log('/// *******[DROPBOX APP ERROR - start]******* ///');
            console.log('OAuth request failed - could not get Bearer Token. Dropbox response: HTTP ' + data.status + ' ' + data.statusText);
            console.log('/// *******[DROPBOX APP ERROR - end]******* ///');
        }

    };
}(this));