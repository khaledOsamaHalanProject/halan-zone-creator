<template>
  <div class="screen">
    <div class="form-container">
      <img :src="R.images.halan_logo" class="brand-logo" />
      <div class="brand-title">Halan</div>
      <form class="inputs">
        <label for="name">Username : </label>
        <input type="text" id="name" name="name" v-model="username" />
        <label for="password">Password : </label>
        <div class="password-container">
          <input
            :type="passwordType"
            id="password"
            name="password"
            autocomplete="off"
            v-model="password"
          />
          <div class="password-toggle-button" @click="passwordTypeToggle">
            <img
              :src="R.images.icon_cyan_hide_password"
              v-if="passwordType === 'text'"
            />
            <img v-else :src="R.images.icon_cyan_show_password" />
          </div>
        </div>
        <button
          class="submit"
          type="submit"
          value="Submit"
          @click="loginHandler"
        >
          <p v-if="!checkingCred">Login</p>
          <infinite-loading
            spinner="spiral"
            v-else-if="checkingCred"
          ></infinite-loading>
        </button>
      </form>
    </div>
    <div
      :class="{
        'warning-popup': true,
        'warning-popup-show': wrongCredentialsFlag,
      }"
    >
      <div @click="closeWarningPopup" class="warning-popup-close-icon">
        <img :src="R.images.icon_close" />
      </div>
      <p>Incorrect credentials, please try again</p>
    </div>
  </div>
</template>

<script>
import R from "../assets/R";
import baseUrls from "../network/_baseUrls.json";
import endpoints from "../network/endPoints";
import requests from "../network/requests";

import InfiniteLoading from "vue-infinite-loading";

export default {
  data() {
    return {
      username: "",
      password: "",
      passwordType: "password",
      wrongCredentialsFlag: false,
      checkingCred: false,
      R,
    };
  },
  components: {
    InfiniteLoading,
  },
  methods: {
    loginHandler: function (e) {
      e.preventDefault();
      this.checkingCred = true;
      requests
        .postData(
          baseUrls.zones + endpoints.login,
          {
            username: this.username,
            password: this.password,
          },
          {
            "Content-Type": "application/json",
          }
        )
        .then((actResponse) => {
          if (actResponse.message === "Auth sucessful") {
            window.localStorage.setItem("token", actResponse.token);
            this.checkingCred = false;
            this.$router.push("map-drawer");
          } else {
            this.username = "";
            this.password = "";
            this.checkingCred = false;
            this.wrongCredentialsFlag = true;
          }
        });
    },
    passwordTypeToggle: function () {
      if (this.passwordType === "password") {
        this.passwordType = "text";
      } else if (this.passwordType === "text") {
        this.passwordType = "password";
      }
    },
    closeWarningPopup: function () {
      this.wrongCredentialsFlag = false;
    },
  },
  mounted() {},
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;900&display=swap");
* {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
html {
  height: 100vh;
}
body {
  margin: 0;
  width: 100vw;
  height: 100vh;
  background: #ecf0f3;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  place-items: center;
  overflow: hidden;
  font-family: poppins;
}
.screen {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.form-container {
  position: relative;
  width: 350px;
  height: 500px;
  border-radius: 20px;
  padding: 40px;
  box-sizing: border-box;
  background: #ecf0f3;
  box-shadow: 14px 14px 20px #cbced1, -14px -14px 20px white;
}

.brand-logo {
  height: 100px;
  width: 100px;
  display: block;
  margin: auto;
  border-radius: 50%;
  box-sizing: border-box;
  box-shadow: 7px 7px 10px #cbced1, -7px -7px 10px white;
}

.brand-title {
  margin-top: 10px;
  font-weight: 900;
  font-size: 1.8rem;
  color: #1da1f2;
  letter-spacing: 1px;
}

.inputs {
  text-align: left;
  margin-top: 30px;
}

label,
input,
button.submit {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  outline: none;
  box-sizing: border-box;
}
label {
  margin-bottom: 4px;
}

label:nth-of-type(2) {
  margin-top: 12px;
}

input::placeholder {
  color: gray;
}

input {
  background: #ecf0f3;
  padding: 10px;
  padding-left: 20px;
  height: 50px;
  font-size: 14px;
  border-radius: 50px;
  box-shadow: inset 6px 6px 6px #cbced1, inset -6px -6px 6px white;
}

button.submit {
  margin-top: 20px;
  background: #1da1f2;
  height: 40px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 900;
  transition: 0.5s;
  display: flex;
  justify-content: center;
  align-items: center;
}
.infinite-loading-container {
  width: 60px;
  height: 60px;
  transform: scale(0.8);
}

button:hover {
  box-shadow: none;
}
.password-container {
  position: relative;
}
.password-toggle-button {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
}
.password-toggle-button:active {
  opacity: 0.4;
}
.warning-popup {
  transition: top 0.7s;

  height: 77px;
  width: 426px;
  background-color: #1da1f2;
  border-radius: 12px;
  position: absolute;
  top: -155px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.warning-popup-show {
  top: 20px;
}
.warning-popup-close-icon {
  position: absolute;
  top: 5px;
  left: 5px;
}
</style>
