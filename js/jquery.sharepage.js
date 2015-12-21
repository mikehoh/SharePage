/* SharePage 1.0.0 by Michael Hohlovich */
(function($) {

  var init = function(params) {
    return this.each(function(){
      var options = $.extend({
        "networks": ["linkedin", "facebook", "twitter", "googleplus"],
        "url": window.location.href,
        "title": "",
        "source": "",
        "width": 500,
        "height": 500,
        "design": "buttons"
      }, params);

      var buttons = createButtons(options.networks);

      if (buttons.length > 0) {
        getSharesValues(buttons, options.url);
        setShareEvents(buttons, options.url, options.title, options.source, options.width, options.height);
      };

      var cssClass;
      switch (options.design) {
        case "buttons":
          cssClass = "share-buttons";
          break;
        case "links":
          cssClass = "share-links";
          break;
        case "icons":
          cssClass = "share-icons";
          break;
        default:
          cssClass = "";
      };
      $(this).addClass("share-page").addClass(cssClass).html(buttons);

    });
  };

  var destroy = function() {
    return this.each(function(){
      $(this).find(".network").each(function(index, button) {
        $(button).off("click");
      });
      $(this).empty();
    });
  };

  var methods = {
    init: init,
    destroy: destroy
  };

  $.fn.sharepage = function(options) {
    if (methods[options]) {
      return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof options === "object" || !options) {
      return methods.init.apply(this, arguments);
    } else {
      $.error("Method " + options + " does not exist on jQuery.SharePage");
    };
  };

  var getLinkedin = function(url, callback) {
    $.ajax({
      url: "https://www.linkedin.com/countserv/count/share?url=" + encodeURIComponent(url) + "&format=jsonp",
      dataType: "jsonp",
      success: function(data) {
        if (data) {
          callback(data.count);
        } else {
          this.error();
        };
      },
      error: function(status, error) {
        callback("");
      }
    });
  };

  var shareOnLinked = function(url, source, title) {
    return "http://www.linkedin.com/shareArticle?mini=true&url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title) + "&source=" + encodeURIComponent(source);
  };

  var getFacebook = function(url, callback) {
    var fql  = "SELECT url, normalized_url, share_count, like_count, comment_count, " +
               "total_count, commentsbox_count, comments_fbid, click_count FROM " +
               "link_stat WHERE url = '" + url + "'";
    $.ajax({
      url: "https://api.facebook.com/method/fql.query?format=json&query=" + encodeURIComponent(fql),
      success: function(data) {
        if (data[0]) {
          callback(data[0].total_count);
        } else {
          this.error();
        };
      },
      error: function(status, error) {
        callback("");
      }
    });
  };

  var shareOnFacebook = function(url, source, title) {
    return "http://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&t=" + encodeURIComponent(title);
  };

  var shareOnTwitter = function(url, source, title) {
    return "http://www.twitter.com/intent/tweet?url=" + encodeURIComponent(url) + "&via=" + encodeURIComponent(source) + "&text=" + encodeURIComponent(title);
  };

  window.VK = {};
  var getVK = function(url, callback) {
    window.VK.Share = {
      count: function(value, count) {
        callback(count);
      }
    };
    $.ajax({
      url: "https://vkontakte.ru/share.php?act=count&index=1&url=" + encodeURIComponent(url),
      dataType: "jsonp"
    }).done(function(data) {});
  };

  var shareOnVK = function(url, source, title) {
    return "http://vk.com/share.php?url=" + encodeURIComponent(url);
  };

  var getGooglePlus = function(url, callback) {
    var data = {
      "method": "pos.plusones.get",
      "id": url,
      "params": {
        "nolog": true,
        "id": url,
        "source": "widget",
        "userId": "@viewer",
        "groupId": "@self"
      },
      "jsonrpc": "2.0",
      "key": "p",
      "apiVersion": "v1"
    };
    $.ajax({
      type: "POST",
      url: "https://clients6.google.com/rpc",
      processData: true,
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(data) {
        callback(data.result.metadata.globalCounts.count);
      },
      error: function() {
        callback("");
      }
    });
  };

  var shareOnGooglePlus = function(url, source, title) {
    return "http://plus.google.com/share?url=" + encodeURIComponent(url);
  };

  var networksLib = {
    linkedin: {
      name: "LinkedIn",
      counter: true,
      getShares: getLinkedin,
      shareUrl: shareOnLinked
    },
    facebook: {
      name: "Facebook",
      counter: true,
      getShares: getFacebook,
      shareUrl: shareOnFacebook
    },
    twitter: {
      name: "Twitter",
      counter: false,
      shareUrl: shareOnTwitter
    },
    googleplus: {
      name: "Google Plus",
      counter: true,
      getShares: getGooglePlus,
      shareUrl: shareOnGooglePlus
    },
    vk: {
      name: "ВКонтакте",
      counter: true,
      getShares: getVK,
      shareUrl: shareOnVK
    }
  }

  var createButtons = function(networks) {
    var buttons = [];
    networks.forEach(function(network, index) {
      if (networksLib[network]) {
        buttons.push(createButtonHtml(network));
      }
    });
    return buttons;
  };

  var createButtonHtml = function(network) {
    var $button = $("<div class='network' />").addClass(network).attr("data-network", network);
    var $networkTitle = $("<span class='title' />").text(networksLib[network].name);
    $button.html($networkTitle);
    if (networksLib[network].counter) {
      var $counter = $("<span class='counter' />").text(0);
      $button.append($counter);
    }
    return $button;
  };

  var getSharesValues = function(buttons, url) {
    buttons.forEach(function($button, index) {
      var network = $button.data("network");
      if (typeof networksLib[network].getShares === "function") {
        networksLib[network].getShares(url, function(count) {
          $button.find(".counter").html(numberWithCommas(count));
        });
      };
    });
  };

  var setShareEvents = function(buttons, url, title, source, width, height) {
    buttons.forEach(function($button, index) {
      var network = $button.data("network");
      var shareUrl = networksLib[network].shareUrl(url, source, title);
      $button.on("click", function(event) {
        window.open(shareUrl, "", "menubar=no, toolbar=no, resizable=yes, scrollbars=yes, width=" + width + ", height=" + height);
      });
    });
  };

  var numberWithCommas = function(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

})(jQuery);
