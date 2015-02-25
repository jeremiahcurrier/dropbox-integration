(function (window) {
    return {

        events: {
            'app.created': 'init',
            'click .getCode': function(event){
                this.createLoginPopup();
            },
            'click .getToken': 'getAccessToken',
            'keyup #inputValueId': function(event){
              if(event.keyCode === 13)
                return this.processInputValue();
            },
            'getToken.done': 'displayBearerToken'
        },

        requests: {

            getToken: function (code) {
              services.notify('Authenticating to Dropbox...');
                return {
                    url: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&client_id=wlaohmc8nkj7og4&client_secret=as7blmehog1jtdz',
                    // url: 'http://requestb.in/129ruuv1',
                    dataType: 'json',
                    type: 'POST',
                    proxy_v2: true
                };
            }
        },

        init: function () {
            if (1 > 0) { // [PLACEHOLDER CONDITIONAL] - Does this agent have a Bearer Token? Have they Authorized Zendesk Integration yet?
                this.switchTo('getCode');
            } else {
                this.switchTo('sendFiles');
            }
        },

        createLoginPopup: function () {
            // // Option 1: New Browser Tab
            // var url = 'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=wlaohmc8nkj7og4',
            //     win = window.open(url, '_blank');
            // win.focus();

            // Option 2: Pop Up Window
            return window.open(
            // 'https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=' + this.googleClientId + '&redirect_uri=https%3A%2F%2F' + this.zenDeskSubdomain + '.zendesk.com%2Fagent%2F&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
            'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=wlaohmc8nkj7og4',
            // v2: Add 'state' parameter for SEKURRRRRITY!!
            'Login Popup',
            'width=650,height=480,left=400,top=100');
        },

        processInputValue: function() {  // This is where you send the ajax request for the BEARER TOKEN

          var code = this.$('input#inputValueId').val();
          this.ajax('getToken', code);
          var code = this.$('input#inputValueId').val('');

        },

        displayBearerToken: function(data) {
            console.log(data.access_token);
            services.notify('Authenticated to Dropbox!');
            this.switchTo('sendFiles');
            // this.switchTo('sendFiles', {
            //     bearer_token: data.access_token
            // });
        }

    };
}(this));