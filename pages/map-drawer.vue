<template>
  <div style="position: relative">
    <div id="map"></div>
    <button class="downlaod" @click="downloadHandler">
      Download Zones as a json file
    </button>
    <div
      v-if="
        showCreateZonePopup ||
        showIntersectionWarningPopup ||
        showZoneAdjustment
      "
      class="bg"
    >
      <div v-if="showCreateZonePopup" class="popup">
        <div class="brand-title">Add A New Zone</div>
        <form class="inputs">
          <label for="name">Zone Name : </label>
          <input type="text" id="name" name="name" v-model="zoneName" /><br />
          <p v-if="showLabelAlreadyExistFlag" style="color: red">
            Label already exists!
          </p>
          <label for="color">Color : </label>
          <input id="color" name="color" v-model="colorCode" />
          <p v-if="showMissingLableFlag" style="color: red; max-width: 100%">
            Either label or color is missing!
          </p>

          <button class="submit" type="submit" value="Submit" @click="addZone">
            Add Zone
          </button>
        </form>
        <div @click="closeCreateZonePopup" class="popup-close-icon">
          <img :src="R.images.icon_close" />
        </div>
      </div>
      <div v-if="showIntersectionWarningPopup" class="popup">
        Zones Can't be intersected
        <button class="submit" value="Submit" @click="tryAnthorZone">Ok</button>
      </div>
      <div v-if="showZoneAdjustment" class="popup">
        <button class="submit" value="Submit" @click="deleteZone">
          Delete Zone
        </button>
        <button class="submit" value="Submit" @click="updateZone">
          Update Zone
        </button>
        <div
          @click="
            {
              showZoneAdjustment = false;
            }
          "
          class="popup-close-icon"
        >
          <img :src="R.images.icon_close" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import baseUrls from "../network/_baseUrls.json";
import endpoints from "../network/endPoints";
import requests from "../network/requests";
import R from "../assets/R";

import download from "downloadjs";

import overlap from "polygon-overlap";

import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_API_KEY = "AIzaSyChBuWyTmh8L8Grc_7SwqWfHAQy5rTI8DM";
export default {
  data() {
    return {
      zones: [],
      currLoction: { lat: 0, lng: 0 },
      zoneLocations: [],
      zoneLines: [],
      zoneMarkers: [],
      currZone: undefined,
      updatedZone: undefined,
      showCreateZonePopup: false,
      showIntersectionWarningPopup: false,
      showZoneAdjustment: false,
      showLabelAlreadyExistFlag: false,
      showMissingLableFlag: false,
      map: undefined,
      R,
      zoneName: "",
      colorCode: "",
    };
  },
  created() {
    this.$getLocation().then((res) => {
      this.currLoction.lat = res.lat;
      this.currLoction.lng = res.lng;
      return new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      })
        .load()
        .then((google) => {
          this.googleMapRender(google, 5);
          this.createZoneConfig();
        })
        .catch((e) => {
          console.log(e);
        });
    });
  },
  methods: {
    googleMapRender(google, zoom) {
      this.map = new google.maps.Map(document.getElementById("map"), {
        center: this.currLoction,
        zoom,
      });
    },
    createZoneConfig() {
      this.map.addListener("click", ({ latLng }) => {
        this.zoneLocations.push({ lat: latLng.lat(), lng: latLng.lng() });
        this.createMarker(latLng);
        this.zoneLocations.length > 1
          ? this.createPath([
              {
                lat: this.zoneLocations[this.zoneLocations.length - 1].lat,
                lng: this.zoneLocations[this.zoneLocations.length - 1].lng,
              },
              {
                lat: this.zoneLocations[this.zoneLocations.length - 2].lat,
                lng: this.zoneLocations[this.zoneLocations.length - 2].lng,
              },
            ])
          : null;
      });
    },
    createPath(path) {
      const pathLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      this.zoneLines.push(pathLine);
      pathLine.setMap(this.map);
    },
    createMarker(latLng) {
      const marker = new google.maps.Marker({
        position: {
          lat: latLng.lat(),
          lng: latLng.lng(),
        },
        map: this.map,
      });
      marker.addListener("click", () => {
        if (
          //check if the marker clicked is the first marker of the polygon
          marker.position.lng() === this.zoneLocations[0].lng &&
          marker.position.lat() === this.zoneLocations[0].lat
        ) {
          this.finalizeZoneCreation(marker);
        } else {
          this.removePointFromZone(marker);
        }
      });
      this.zoneMarkers.push(marker);
    },
    createZone(locations) {
      const zone = new google.maps.Polygon({
        paths: locations,
        id: "",
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
      });
      zone.addListener("click", () => {
        this.showZoneAdjustment = true;
        this.updatedZone = zone;
      });
      // removing the helper lines from the zone after
      this.zoneLines.forEach((ele) => ele.setMap(null));
      this.currZone = zone;
      zone.setMap(this.map);
    },
    transformZoneLocations(zone) {
      const transformedZone = [];
      zone.forEach((ele) => {
        transformedZone.push([ele.lat, ele.lng]);
      });
      return transformedZone;
    },
    finalizeZoneCreation(firstMarker) {
      this.createPath([
        {
          lat: firstMarker.position.lat(),
          lng: firstMarker.position.lng(),
        },
        {
          lat: this.zoneLocations[this.zoneLocations.length - 1].lat,
          lng: this.zoneLocations[this.zoneLocations.length - 1].lng,
        },
      ]);
      const currZoneLocationFormAdj = this.transformZoneLocations(
        this.zoneLocations
      );
      this.zones.forEach((ele) => {
        if (
          overlap(
            this.transformZoneLocations(ele.points),
            currZoneLocationFormAdj
          )
        ) {
          this.showIntersectionWarningPopup = true;
          throw {
            error: "Intersected areas",
          };
        }
      });
      this.showCreateZonePopup = true;
      this.createZone(this.zoneLocations);
    },
    removePointFromZone(marker) {
      const [lineEndWithMarker] = this.zoneLines.filter((path) => {
        return (
          path.getPath().getArray()[0].lat() === marker.position.lat() &&
          path.getPath().getArray()[0].lng() === marker.position.lng()
        );
      });
      lineEndWithMarker.setOptions({ fillColor: "#000" });
      const [lineStartWithMarker] = this.zoneLines.filter((path) => {
        return (
          path.getPath().getArray()[1].lat() === marker.position.lat() &&
          path.getPath().getArray()[1].lng() === marker.position.lng()
        );
      });

      this.zoneLines = this.zoneLines
        .filter(
          (path) =>
            path.getPath().getArray()[0].lat() !== marker.position.lat() &&
            path.getPath().getArray()[0].lng() !== marker.position.lng()
        )
        .filter(
          (path) =>
            path.getPath().getArray()[1].lat() !== marker.position.lat() &&
            path.getPath().getArray()[1].lng() !== marker.position.lng()
        );
      this.zoneLocations = this.zoneLocations.filter(
        (point) =>
          point.lat !== marker.position.lat() &&
          point.lng !== marker.position.lng()
      );
      if (lineEndWithMarker && lineStartWithMarker) {
        this.createPath([
          {
            lat: lineStartWithMarker.getPath().getArray()[0].lat(),
            lng: lineStartWithMarker.getPath().getArray()[0].lng(),
          },
          {
            lat: lineEndWithMarker.getPath().getArray()[1].lat(),
            lng: lineEndWithMarker.getPath().getArray()[1].lng(),
          },
        ]);
        lineStartWithMarker.setMap(null);
      }
      if (lineEndWithMarker !== undefined) lineEndWithMarker.setMap(null);
      marker.setMap(null);
    },

    closeCreateZonePopup() {
      this.showCreateZonePopup = false;
      this.zoneLocations = [];

      this.zoneMarkers.forEach((ele) => ele.setMap(null));
      this.zoneMarkers = [];

      this.zoneLines.forEach((ele) => ele.setMap(null));
      this.zoneLines = [];

      this.currZone.setMap(null);
      this.currZone = undefined;
    },
    addZone: async function (e) {
      e.preventDefault();
      requests
        .postData(
          baseUrls.zones + endpoints.zonesGetCreate,
          {
            label: this.zoneName,
            points: this.zoneLocations,
            color: this.colorCode,
          },
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.token}`,
          }
        )
        .then((res) => {
          if (res.message === "zone created!") {
            this.zones.push({
              label: this.zoneName,
              points: this.zoneLocations,
              color: this.colorCode,
            });
            this.currZone.setOptions({ id: this.zoneName });
            this.currZone.setOptions({ strokeColor: this.colorCode });
            this.currZone.setOptions({ fillColor: this.colorCode });
            this.showCreateZonePopup = false;
            this.zoneLocations = [];
            this.zoneMarkers.forEach((ele) => ele.setMap(null));
            this.zoneMarkers = [];
            this.zoneLines.forEach((ele) => ele.setMap(null));
            this.zoneLines = [];
            this.zoneName = "";
            this.colorCode = "";
          } else if (
            res.message ===
            "Please make sure you add label, color and zones array"
          ) {
            this.showMissingLableFlag = true;
            setTimeout(() => {
              this.showMissingLableFlag = false;
            }, 3500);
          } else if (res.message === "Label already exists") {
            this.showLabelAlreadyExistFlag = true;
            setTimeout(() => {
              this.showLabelAlreadyExistFlag = false;
            }, 3500);
          }
        });
    },
    deleteZone: async function () {
      //remove zone form cache storage
      this.zones = this.zones.filter(
        (ele) => String(ele.label) !== String(this.updatedZone.id)
      );

      //remove zone form Database
      // find the zone ID
      let idOfDeletedZone = undefined;
      await requests
        .getData(baseUrls.zones + endpoints.zonesGetCreate, {
          Authorization: `Bearer ${window.localStorage.token}`,
          Accept: "application/json",
        })
        .then((res) => {
          idOfDeletedZone = res.data.filter((ele) => {
            return ele.label === this.updatedZone.id;
          })[0]._id;
        });
      requests.deleteData(
        baseUrls.zones + endpoints.zonesUpdateDelete + idOfDeletedZone,
        {
          Authorization: `Bearer ${window.localStorage.token}`,
          Accept: "application/json",
        }
      );

      this.updatedZone.setMap(null);
      this.showZoneAdjustment = false;
    },
    updateZone() {
      // remove the zone from map
      this.deleteZone();
      // clear the cache arrays
      this.tryAnthorZone();
      // draw a new zone with the old zone
      this.updatedZone
        .getPath()
        .getArray()
        .forEach((ele) => {
          this.zoneLocations.push({
            lat: ele.lat(),
            lng: ele.lng(),
          });
          this.createMarker({
            lat: () => ele.lat(),
            lng: () => ele.lng(),
          });
        });

      this.zoneLocations.forEach((ele, index) => {
        if (index !== 0) {
          this.createPath([ele, this.zoneLocations[index - 1]]);
        }
      });
    },
    tryAnthorZone() {
      this.showIntersectionWarningPopup = false;
      // clear the cache arrays to start a new zone
      this.zoneLocations = [];
      this.zoneMarkers.forEach((ele) => ele.setMap(null));
      this.zoneMarkers = [];
      this.zoneLines.forEach((ele) => ele.setMap(null));
      this.zoneLines = [];
    },
    downloadHandler() {
      download(JSON.stringify(this.zones), "zones.json", "text/plain");
    },
  },
  mounted() {
    requests
      .getData(baseUrls.zones + endpoints.zonesGetCreate, {
        Authorization: `Bearer ${window.localStorage.token}`,
        Accept: "application/json",
      })
      .then((res) => {
        res.data.forEach((ele) => {
          const polyPointsTransformed = [];
          ele.points.forEach((ele) => {
            polyPointsTransformed.push({
              lat: parseFloat(ele.lat),
              lng: parseFloat(ele.lng),
            });
          });
          const zone = new google.maps.Polygon({
            paths: polyPointsTransformed,
            id: ele.label,
            strokeColor: ele.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: ele.color,
            fillOpacity: 0.35,
          });
          zone.addListener("click", () => {
            this.showZoneAdjustment = true;
            this.updatedZone = zone;
          });
          this.zones.push({
            label: ele.label,
            points: polyPointsTransformed,
            color: ele.color,
          });
          zone.setMap(this.map);
        });
      });
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;900&display=swap");

body {
  font-family: poppins;

  margin: 0;
}
#map {
  width: 100%;
  height: 100vh;
}
.bg {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100vh;
  top: 0;
}
.popup {
  padding: 35px 29px 35px;
  box-shadow: 1px 1px 10px;
  border-radius: 5px;
  background-color: seashell;
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
}
.inputs {
  text-align: left;
  margin-top: 30px;
}
.brand-title {
  margin-top: 10px;
  font-weight: 900;
  font-size: 1.8rem;
  color: #1da1f2;
  letter-spacing: 1px;
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
.popup-close-icon {
  position: absolute;
  top: 7px;
  left: 7px;
}
.popup-close-icon img {
  background-color: #1da1f2;
  border-radius: 42px;
}
button.submit {
  min-width: 175px;
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
.downlaod {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: none padding-box rgb(255, 255, 255);
  display: table-cell;
  border: 0px;
  margin: 0px;
  padding: 0px 17px;
  text-transform: none;
  appearance: none;
  cursor: pointer;
  user-select: none;
  direction: ltr;
  overflow: hidden;
  text-align: center;
  height: 40px;
  vertical-align: middle;
  color: rgb(86, 86, 86);
  font-family: Roboto, Arial, sans-serif;
  font-size: 18px;
  border-bottom-right-radius: 2px;
  border-top-right-radius: 2px;
  box-shadow: rgb(0 0 0 / 30%) 0px 1px 4px -1px;
  min-width: 66px;
}
.downlaod:hover {
  background: none padding-box rgb(193 193 193);
  color: #000;
}
</style>
