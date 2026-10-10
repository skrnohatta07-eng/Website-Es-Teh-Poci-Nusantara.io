/*
 * jquery.js
 * Integrasi jQuery + PHP untuk website Es Teh Poci Nusantara.
 * File ini dijalankan setelah jquery.min.js.
 */
(function ($) {
  "use strict";

  function setServerMessage(text, type) {
    var msg = $("#orderMsg");
    if (!msg.length) return;
    msg.text(text || "");
    msg.removeClass("ok err");
    if (type) msg.addClass(type);
  }

  function loadServerConfig() {
    $.ajax({
      url: "api.php",
      method: "GET",
      data: { action: "config" },
      dataType: "json",
      cache: false
    }).done(function (response) {
      if (!response || !response.success || !response.data) return;
      var shop = response.data.shop || {};
      if (shop.name) $("[data-shop-name]").text(shop.name);
      if (shop.address) $("#ftAddr, #locAddr").text(shop.address);
      if (shop.wa) $("#ftWa, #locWa").text(shop.wa);
      if (shop.open !== undefined && shop.close !== undefined) {
        $("#ftHours, #locHours").text(shop.open + ":00 - " + shop.close + ":00");
      }
    }).fail(function () {
      console.warn("jQuery/PHP: konfigurasi server tidak dapat diambil.");
    });
  }

  function getCart() {
    try {
      var cart = JSON.parse(localStorage.getItem("esteh-poci-cart"));
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function numberFromText(text) {
    var value = String(text || "").replace(/[^0-9]/g, "");
    return value ? Number(value) : 0;
  }

  function buildOrderPayload(link) {
    var cart = getCart();
    var method = $("input[name='method']:checked").val() || "ambil";
    var subtotal = numberFromText($("#subTotal").text());
    var discount = numberFromText($("#discAmt").text());
    var delivery = numberFromText($("#feeAmt").text());
    var total = numberFromText($("#cartTotal").text());

    return {
      whatsapp_url: link.attr("href") || "",
      page: window.location.href,
      created_from: "website",
      browser: navigator.userAgent,
      customer: {
        name: $.trim($("#custName").val() || ""),
        address: $.trim($("#custAddr").val() || ""),
        note: $.trim($("#custNote").val() || "")
      },
      fulfillment: method,
      promo: $.trim($("#promoInput").val() || "").toUpperCase(),
      items: cart,
      totals: {
        subtotal: subtotal,
        discount: discount,
        delivery: delivery,
        total: total
      }
    };
  }

  function saveOrderToServer() {
    var link = $("#waLink");
    if (!link.length) return;

    link.on("click.jqueryBackend", function () {
      if (link.attr("aria-disabled") === "true") return;

      var order = buildOrderPayload(link);
      if (!order.items.length) return;

      // AJAX POST: data pesanan dikirim ke PHP sebelum/bersamaan dengan pembukaan WhatsApp.
      $.ajax({
        url: "api.php?action=order",
        method: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(order),
        dataType: "json",
        timeout: 5000
      }).done(function (response) {
        if (response && response.success) {
          setServerMessage("Pesanan berhasil dicatat ke MySQL. ID: " + response.data.id, "ok");
          console.log("MySQL/PHP: pesanan tercatat", response);
        } else {
          setServerMessage("Pesanan WhatsApp tetap dibuka, tetapi pencatatan server gagal.", "err");
        }
      }).fail(function (xhr) {
        console.warn("PHP: pesanan belum tercatat", xhr.status);
        setServerMessage("WhatsApp tetap dibuka, tetapi server belum menerima pesanan.", "err");
      });
    });
  }

  function addJQueryEffects() {
    $(".btn").on("mouseenter", function () {
      $(this).stop(true, true).animate({ opacity: 0.86 }, 120);
    }).on("mouseleave", function () {
      $(this).stop(true, true).animate({ opacity: 1 }, 120);
    });

    $(document).on("click", "#waLink", function () {
      $(this).addClass("jquery-clicked");
      setTimeout(function () { $("#waLink").removeClass("jquery-clicked"); }, 500);
    });
  }

  $(function () {
    loadServerConfig();
    saveOrderToServer();
    addJQueryEffects();
    console.log("jQuery aktif: AJAX PHP + efek tombol siap.");
  });
})(jQuery);
