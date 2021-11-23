const rp = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const request = require('request');
var shell = require('shelljs');
var path = require('path');
var getDirName = require('path').dirname;
var mkdirp = require('mkdirp');
const { constants } = require('buffer');

const download = function (uri, filename, callback) {
  console.log("Made it here 2");
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
]

urls.reverse(); //reverse array order because we are using the pop method

const domain = "https://healthandvitalitycenter.com";

scrape(urls, "", []);

function scrape(urls) {
    sleep(1000).then(() => { //set limiter time here
        if (urls.length > 0) {
            rp(domain + urls.pop()).then(function (html) {
              var $ = cheerio.load(html);

              const seotitle = $("title").text();
              const seodesc = $("meta[name='description']").attr("content");
              const h1 = $(".main-flex h2").text();
              const subhead = $(".main-flex h3").text();
              const content = $(".fusion-column-wrapper").html();
              // const img1 = $(".fusion-imageframe").html();

              // console.log(content);


              // /* DOWNLOAD ALL IMAGES */
              // $img = $.load(img1);
              // $img("img").each(function () {
              //     const img = $img(this).attr("src"); //change whether lazy loaded or not
              //     const newImgUrl = "/assets/img/condition/" + path.basename(img).trim();
              //     console.log(newImgUrl);
              //     const newImgPath = __dirname + newImgUrl;
              //     console.log(newImgPath);
              //     download(img, newImgPath, function () { });
              //     $img(this).attr("data-src", newImgUrl);
              // });


              WritePage(seotitle, seodesc, subhead, h1, content);
              scrape(urls);
            })
        }
        else {
            WritePage(seotitle, seodesc, subhead, h1, content);
            console.log("we did it - we're heroes");
        }
    });

}

function WritePage(seotitle, seodesc, subhead, h1, content) {
    let phpfile = `
<?php
  $seotitle = "${seotitle}";
  $seodesc = "${seodesc}";
  $section = "conditions";
  $pagename = "";
?>

<?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/header.php" ?>

<section class="masthead mb100 bg-image animate zoomOutBg box-shadow-smooth bg-top" style="--bgImage: url(/assets/img/masthead/26.jpg);">
  <div class="container">
    <div class="container mb100">
      <h1 class="white title-xl animate fadeIn">${h1}
        <div class="animate fadeIn white mt25 title-sm hr-vert">in Los Angeles, CA</div>
      </h1>
    </div>
  </div>
</section>

<section class="mb100">
  <div class="container">
    <div class="mw1000">
      <h2 class="animate fadeIn title-lg text-center highlight-color">${subhead}</h2>      
    </div>
  </div>
</section>

<section class="mb100">
  <div class="container">
    <div class="mw1200 animate fadeIn">
    ${content}
      <div class="container mt100">
        <div class="mw800">
          <img src="/assets/img/conditions/health-and-vitality-center-acne-2.jpg" class="box-shadow-smooth" alt="">
        </div>
      </div>
    </div>
  </div>
</section>

<?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/request-consult.php" ?>
<?php include $_SERVER['DOCUMENT_ROOT'] . "/assets/inc/footer.php" ?>

<script>
</script>
  
  `;
    shell.mkdir('-p', __dirname);
    const wstream = fs.createWriteStream(__dirname + "/medical-conditions/" + 'index.php');
    wstream.write(phpfile);
    wstream.end();
}
