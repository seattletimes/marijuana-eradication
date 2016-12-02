// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("savage-image");

var $ = require("./lib/qsa");
var colors = require("./lib/colors");
var dot = require("./lib/dot");

var image = document.querySelector("savage-image");

var mj = window.marijuanaData;
const CENTER = [255, 255, 255];
const LOW_COLOR = [123, 90, 166];
const HIGH_COLOR = [248, 158, 93];

var lerp = function(a, b, d) {
  return a.map((v, i) => v * (1 - d) + b[i] * d);
};

var views = {
  "cpp": {
    property: "cpp_2015",
    percap: false
  },
  "dea": {
    property: "dea_2015",
    percap: false
  },
  "dea-delta": {
    property: "dea_delta",
    percap: false,
    zero: true
  },
  "eradicated": {
    property: "eradicated_2015",
    percap: false
  }
}

image.addEventListener("load", function() {

  for (var s in mj) {
    var state = mj[s];
    if (!state.dea_2015 && !state.dea_2014) {
        var group = document.querySelector(`g#${s}`);
        group.setAttribute("class", group.getAttribute("class") + " did-not-participate");
        state.exclude = true;
    } else {
      ["cpp", "dea", "eradicated"].forEach(function(k) {
        state[`${k}_delta`] = state[`${k}_2015`] - state[`${k}_2014`];
      });
    }
  }

  var m7 = "CA HI KY OR TN WA WV".split(" ");
  if (false) m7.forEach(function(s) {
    var group = document.querySelector(`g#${s}`);
    var poly = group.querySelector("polygon")
    poly.style.stroke = "black";
    poly.style.strokeWidth = 2;
    group.parentNode.appendChild(group);
  });

  var legalized = "AK CO OR WA".split(" ");
  legalized.forEach(function(s) {
    var group = document.querySelector(`g#${s}`);
    var poly = group.querySelector("polygon")
    poly.style.stroke = "black";
    poly.style.strokeWidth = 2;
    group.parentNode.appendChild(group);
  })

  var paint = function(config, low, high, middle) {
    var postals = Object.keys(mj).filter(p => !mj[p].exclude);
    var values = postals.map(function(s) {
      var v = mj[s][config.property];
      if (config.percap) return v / mj[s].population;
      return v;
    });
    var max = Math.max(...values);
    var min = Math.min(...values);
    var range = max - min;

    var commafy = function(n) { return n.toLocaleString().replace(/\.0+/g, "") };
    var key = document.querySelector(".key");
    if (config.zero) {
      key.innerHTML = `
<div class="scale">
  <div class="left zone">
    <div class="below-zero gradient"></div>
    $${commafy(min)}
  </div>
  <div class="zero-point zone">
    <div class="gradient"></div>
    0
  </div>
  <div class="right zone">
    <div class="above-zero gradient"></div>
    $${commafy(max)}
  </div>
</div>
      `;
    } else {
      key.innerHTML = `
<div class="scale">
  <div class="zero-point zone">
    <div class="gradient"></div>
    0
  </div>
  <div class="right zone">
    <div class="above-zero gradient"></div>
    ${commafy(max)}
  </div>
</div>
      `
    }

    postals.forEach(function(p, i) {
      var value = values[i];
      var polygon = document.querySelector(`g#${p} polygon`);
      var label = document.querySelector(`g#${p} text`);
      var scaled;
      var color;
      if (config.zero) {
        label.style.fill = "black";
        if (value > 0) {
          scaled = value / max;
          color = lerp(middle, high, scaled);
        } else {
          scaled = Math.abs(value / min);
          color = lerp(middle, low, scaled);
        }
      } else {
        scaled = (value - min) / range;
        color = lerp(low, high, scaled);
      }
      polygon.style.fill = color instanceof Array ? colors.rgb.apply(null, color) : color;
    });
  };

  var changeView = function() {
    var key = document.querySelector(".key");
    var v = this.getAttribute("data-view");
    var config = views[v];
    if (config.zero) {
      paint(config, LOW_COLOR, HIGH_COLOR, CENTER);
    } else {
      paint(config, CENTER, HIGH_COLOR);
    }
    var previous = document.querySelector(".filter-view.active");
    if (previous) previous.classList.remove("active");
    this.classList.add("active");
  };

  $(".filter-view").forEach(el => el.addEventListener("click", changeView));

  changeView.call(document.querySelector(".filter-view"));

  var detailTemplate = dot.compile(require("./_detail.html"));

  var showDetail = function(e) {
    if (e.type == "mousemove" && clicked) return;
    if (e.type == "click") clicked = true;
    var state = this.getAttribute("id");
    var panel = document.querySelector(".detail-panel");
    var data = mj[state];
    var commafy = n => n.toLocaleString().replace(/\.0+$/, "");
    panel.innerHTML = detailTemplate(data);
  };

  var clicked = false;
  var groups = $("savage-image g");
  groups.forEach(el => el.addEventListener("click", showDetail))
  groups.forEach(el => el.addEventListener("mousemove", showDetail));

});