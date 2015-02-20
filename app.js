(function (window) {
    return {
        // zenDeskSubdomain: 'YOUR_ZENDESK_SUBDOMAIN',
        // googleClientId: 'YOUR_GOOGLE_CLIENT_ID',

        events: {
            'app.activated': 'onActivate',
            'app.deactivated': 'onDeactivate',
            'click .getCode': 'onLogInOutClick',
            // 'click .getToken': 'onShowUserNameClick'
            'click .getToken': 'getAccessToken',
            'keyup #inputValueId': function(event){
              if(event.keyCode === 13)
                return this.processInputValue();
            },
            // 'getToken.done': function(data) {
            //   console.log(data);
            //   services.notify('OAuth 2.0 Bearer Token for Dropbox requests received!');
            // }
        },

        requests: {
            // getUserInfo: function (access_token) {
            //     return {
            //         url: 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + access_token,
            //         type: 'GET',
            //         proxy_v2: true
            //     };
            // },

            getToken: function (code) {

              services.notify('Getting your Bearer Token, just a sec');

                return {
                    // url: 'https://api.dropbox.com/1/oauth2/token?code=' + code + '&grant_type=authorization_code&client_id=wlaohmc8nkj7og4&client_secret=as7blmehog1jtdz',
                    url: 'http://requestb.in/129ruuv1',
                    type: 'POST',
                    proxy_v2: true
                };
            }
        },

        onActivate: function () {
            // console.info("onActivate()");
            this.accessToken();
            var user_id = this.ticket().customField("custom_field_22931898");
            this.$('.userid').text(user_id);
        },

        onDeactivate: function () {
            // console.info("onDeactivate()");
            if (this.timer) {
                clearTimeout(this.timer);
            }
        },

        onShowUserNameClick: function () {
            var access_token = this.accessToken();

            if (!access_token) {
                // console.info("Can't do it!  No access_token!");
                return;
            }

            this.ajax('getUserInfo', access_token)
                .done(function (data) {
                    // console.info(data);
                    this.$('.username').text(data.name);
                });
        },

        onLogInOutClick: function (event) {
            if (this.accessToken()) {
                this.logout(event);
            } else {
                this.login(event);
            }
        },

        login: function (event) {
            // console.info("login()");
            event.preventDefault();
            var popup = this.createLoginPopup();
            this.awaitAccessToken(popup);
        },

        logout: function (event) {
            // console.info("logout()");
            event.preventDefault();
            this.accessToken(null);
            // console.info("  access_token = " + this.accessToken());
            this.$('.getCode').text('login');
        },

        // Testing start

        createLoginPopup: function () {
            // console.info("createLoginPopup()");
            return window.open(
            // 'https://accounts.google.com/o/oauth2/auth?response_type=token&client_id=' + this.googleClientId + '&redirect_uri=https%3A%2F%2F' + this.zenDeskSubdomain + '.zendesk.com%2Fagent%2F&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile',
            'https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=wlaohmc8nkj7og4',
            // v2: Add 'state' parameter for SEKURRRRRITY!!
            'Login Popup',
            'width=400,height=400');
        },

        // Testing end

        timer: null,
        awaitAccessToken: function (popup) {
            // console.info("awaitAccessToken()");
            if (this.isLoaded(popup)) {
                // console.info("  popup is loaded");
            } else {
                // console.info("  popup is NOT loaded; sleeping");
                var t = this;
                this.timer = setTimeout(
                    function () { t.awaitAccessToken(popup); },
                    1000);
                return;
            }

            var access_token = this.parseAccessToken(popup.location.href);

            if (access_token) {
                // console.info('  access_token = ' + access_token);
                popup.close();
                this.accessToken(access_token);
            } else {
                services.notify('Error requesting code...');
            }
        },

        isLoaded: function (win) {
            try {
                return ('about:blank' !== win.location.href) && (null !== win.document.body.innerHTML);
            } catch (err) {
                return false;
            }
        },

        parseAccessToken: function (uri) {
            var match = uri.match(/[#&]access_token=([^&]*)/i);
            return match[1] || null;
        },

        accessToken: function (value) {

            if (1 === arguments.length) {
                // console.info("Storing access_token = " + value);
                this.store({ access_token: value });
            }

            var token = this.store('access_token');
            // console.info("access_token = " + value);

            var loginout = this.$('.getCode');
            if (token) {
                loginout.text('logout - opposite of getCode');
            } else {
                loginout.text('Get OAuth 2.0 CODE');
            }

            return token;
        },

        // f(x) added by jeremiah

        processInputValue: function() {  // This is where you send the ajax request for the BEARER TOKEN

          var code = this.$('input#inputValueId').val();
          this.ajax('getToken', code).done(function(data) {
            console.log('**********    RESPONSE    **********');
            console.log(data);
            services.notify('OAuth 2.0 Bearer Token is: ' + data);
          });

        },

        displayBearerToken: function(data) {
            console.log('**************   displayBearerToken   **************');
            console.log(data);
            console.log('**************   ... that was it ...   **************');
              // this.switchTo('done', {
              //   bearer_token: this.totalDeletedTickets
              // });
            services.notify('OAuth 2.0 Bearer Token for Dropbox requests received!');
        }

    };
}(this));