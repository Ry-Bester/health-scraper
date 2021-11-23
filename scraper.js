const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');
var shell = require('shelljs');
var path = require('path');
var getDirName = require('path').dirname;
var mkdirp = require('mkdirp');

const download = function (uri, filename, callback) {
    request.head(encodeURI(uri), function (err, res, body) {
        mkdirp(getDirName(filename), function (err) {
            if (err) return cb(err);
            request(encodeURI(uri)).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    });
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const urls = [
    "/medical-conditions/acne/",
    // "medical-conditions/attention-deficit-hyperactivity-disorder-adhdadd/",
    // "medical-conditions/adrenal-fatigue/",
    // "medical-conditions/allergies/",
    // "medical-conditions/anxiety-and-depression/",
    // "medical-conditions/asthma/",
    // "medical-conditions/autoimmune-disorders/",
    // "medical-conditions/brain-fog/",
    // "medical-conditions/cancer/",
    // "medical-conditions/cardiovascular-disease/",
    // "medical-conditions/chronic-bacterial-vaginosis/",
    // "medical-conditions/chronic-fatigue-syndrome/",
    // "medical-conditions/chronic-joint-pain/",
    // "medical-conditions/chronic-uti/",
    // "medical-conditions/chronic-yeast-infections/",
    // "medical-conditions/dermatitis/",
    // "medical-conditions/digestive-disorders/",
    // "medical-conditions/fibromyalgia/",
    // "medical-conditions/hair-loss/",
    // "medical-conditions/heavy-metal-toxicity/",
    // "medical-conditions/hypothyroidism/",
    // "medical-conditions/infertility/",
    // "medical-conditions/insomnia/",
    // "medical-conditions/interstitial-cystitis/",
    // "medical-conditions/irregular-periods-menses/",
    // "medical-conditions/leaky-gut-syndrome/",
    // "medical-conditions/memory-problems/",
    // "medical-conditions/migraine-headaches/",
    // "medical-conditions/osteoporosis/",
    // "medical-conditions/overweight/",
    // "medical-conditions/parkinsons-disease/",
    // "medical-conditions/pms/",
    // "medical-conditions/rheumatoid-arthritis/",
]



urls.reverse(); //reverse array order because we are using the pop method

const domain = "https://healthandvitalitycenter.com";

scrape(urls, "", []);

function scrape(urls, conUrls) {
    sleep(1000).then(() => { //set limiter time here
        if (urls.length > 0) {
            rp(domain + urls.pop()).then(function (html) {


                let congUrl = "";
                var $ = cheerio.load(html);
                $(".fusion-text-4 a", html).each(function () {

                    conUrl = $(this).attr("href");
                    conUrls.push(conUrl);

                });



                /* SET  CONTENT ITEMS HERE */
                const title = $("title", html).text();
                const seodesc = $("meta[name='description']", html).attr("content");

                const h1 = $("h1 .title", html).text(); //change based on the title of thpost on the page
                let content = $(".post-content", html).html(); //set based on the contenfor thhtml on the page

                /* DOWNLOAD ALL IMAGES */
                $img = $.load(content);
                $img("img").each(function () {
                    const img = $img(this).attr("src"); //change whether lazy loaded or not
                    const newImgUrl = "/assets/img/condition/" + path.basename(img).trim();
                    const newImgPath = __dirname + newImgUrl;
                    download(img, newImgPath, function () { });
                    $img(this).attr("data-src", newImgUrl);
                });


                // content = content.replace("data-src","src"); //do this if the images are lazy loaded

                WritePage(title, seodesc, h1, $img.html(),);
                scrape(urls, conUrls);
            })
        }
        else {
            WritePage("Conditions", "", "Conditions", "/condition/");
            console.log("we did it - we're heroes");
        }
    });

}


function WritePage(title, seodesc, h1, content,) {
    let phpfile = `
  <?php
  $seotitle = "${title}";
  $seodesc = "${seodesc}";
  $section =;
  ?>

  <?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/header.php" ?>

  <section class="masthead bg-image animate zoomOutBg" style="--bgImage: url(/assets/img/masthead/home.jpg);">
    <div class="container pv50">
      <div class="pv200">
        <h1 class="title-xl text-center mb10 white animate fadeIn">${h1}</h1>
      </div>
    </div>
  </section>


  <section class="mv100">
    <div class="container">
      <?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/logos.php" ?>
    </div>
  </section>

  <section class="mv100">
    <div class="container">
      <div class="mw1200">
        ${content}
        <div class=""mw800">
          
        </div>
      </div>
    </div>
  </section>

  <?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/request-consult.php" ?>
  <?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/footer.php" ?>

  <script>
  </script>`;
    shell.mkdir('-p', __dirname);
    const wstream = fs.createWriteStream(__dirname + + '/index.php');
    wstream.write(phpfile);
    wstream.end();
}
