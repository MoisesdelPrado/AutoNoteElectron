const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer-core");
const bodyParser = require('body-parser');
const Dictionary = require("./Dictionary.js");

const PORT = process.env.PORT || 4000; //backend routing port

const app = express();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors({origin:"http://localhost:3000"}));
app.use(function(req, res, next) {
    const corsWhiteList = [
        "http://localhost:3000",
        "http://localhost:4000",
        "http://localhost:9222"
    ];
    if (corsWhiteList.indexOf(req.headers.origin) !== -1) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type:application/json, Accept');
    }
    next();
});

app.get("/", async(req, res) => {
    res.send("Server is working");
});

//Store KP info for other functions to use
var KPinfo = {
    MD_Degree:false,
    keywords: [],
    degreesKeywords: [],
    matchedKeyword: "",
    englishMatchedKeyword: ""
}

//Route to activate puppeteer for Copy function
app.post('/copy', async(req, res) => {

//Reset shared variables 
KPinfo.MD_Degree = false;
KPinfo.keywords = [];
KPinfo.degreesKeywords = [];
KPinfo.matchedKeyword = "";
KPinfo.englishMatchedKeyword = "";


const url = req.body.link;
const browserUrl = "http://127.0.0.1:9222";

    try {
    const browser = await puppeteer.connect({
        browserURL:browserUrl,
        defaultViewport:null
    });
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "networkidle0"
    });

        const englishName = await page.$$eval('h4.d-inline-block > a > span', 
        (elems) => {
            return elems.map(elem => elem.textContent);
        });

        
        // Original name may not exist in the page, this function confirms its existence first
        let originalName;
        if (await page.$('h6') !== null) {
            originalName = await page.$eval('h6',
            (elem) => {
                return elem.textContent;
            });
        }
        

        const englishAffiliations = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-footer > div:nth-child(3) > div > span', 
        (elems) => {
            return elems.map(elem => elem.textContent);
        });
        englishAffiliations.shift();


        const affiliations = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-footer > div:nth-child(4) > div > span', 
        (elems) => {
            return elems.map(elem => elem.textContent);
        });
        affiliations.shift();
        

        let commentBox = [];
        let affiliationRegex = /(?<=((KOL[:\n]?)|(KP[:\n]?))).*(?=(Namesake))?/gis;
        let commentAffiliations = [];
        let namesakeRegex = /(Namesake[:s\n]?).*(?=(KOL|KP))?/gis;
        let namesakes;

        // Comment box will not appear automatically if there are no comments, this detects it
        if (await page.$('body > ngb-modal-window > div > div > div > div.modal-body > dirt-comment-list > section > div:nth-child(2) > div') !== null) {
        
            commentBox = await page.$$eval('body > ngb-modal-window > div > div > div > div.modal-body > dirt-comment-list > section > div:nth-child(2) > div',
            (elems) => {
                return elems.map(elem => elem.textContent.trim());
            });
            
            //Find all that match regex in the comment box for KOL/KP tags
            let commentAffiliationsSrc = [];
            commentBox.forEach(elems => {
                commentAffiliationsSrc.unshift(elems.match(affiliationRegex));
            })
            commentAffiliations = commentAffiliationsSrc.flat(2).filter(n => n);
            
            //Find all that match regex in the comment box for namesake tags
            let namesakesSrc = [];
            commentBox.forEach(elems => {
                namesakesSrc.unshift(elems.match(namesakeRegex));
            })
            namesakes = namesakesSrc.flat(2).filter(n => n);

        }


        // Keywords/Specialties may not exist in the page, this detects it first before executing
        if (await page.$('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div:nth-child(1) > span') !== null) {
           
            KPinfo.keywords = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div:nth-child(1) > span',
            (elems) => {
                return elems.map(elem => elem.textContent.trim());
            });
            KPinfo.keywords.pop();
        }


        // Degrees container box may not exist within the page, this detects it first before executing
        let degrees;
        if (await page.$('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div.degree > span') !== null) {

            degrees = await page.$$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-header > div.col-md-3.di-header-specialty > div.degree > span',
            (elems) => {
                return elems.map(elem => elem.textContent.trim());
            });
            KPinfo.degreesKeywords = degrees.map(elems => elems.split(' '));
            KPinfo.degreesKeywords.flat(2).filter(n => n);


            if (degrees.includes('Doctor of Medicine (MD)')) {
                KPinfo.MD_Degree = true;
            } else {
                KPinfo.MD_Degree = false;
            }

        }


        const kolID = await page.$eval('body > dirt > dirt-profile > div > section > dirt-profile-detail > section > div > div.row.di-header-wrapper > div > div.row.di-info-footer > div:nth-child(8) > div > span.di-bold',
        (elem) => {
            return elem.textContent;
        });


        console.log(`
        ${englishName}                               \n
        ${originalName}                              \n
        ${[...englishAffiliations, ...affiliations, ...commentAffiliations]} \n
        ${KPinfo.keywords}                                  \n
        ${KPinfo.degreesKeywords}                           \n
        ${kolID}                                     \n
        ${KPinfo.MD_Degree}                                 \n
        ${commentAffiliations}                       \n
        ${namesakes}                                 \n
        `); 


    res.send(JSON.stringify({
        'englishName':englishName,
        'originalName':originalName,
        'commentAffiliations':[...englishAffiliations, '\n', ...affiliations, '\n', ...commentAffiliations],
        'keywords':KPinfo.keywords,
        'degrees':degrees,
        'kolID':kolID,
        'namesakes':namesakes
        }));


    await page.waitForTimeout(2000);
    await page.close();
    

    } catch (error) {
        console.log(error);
    }
});


//Route to activate puppeteer for Search function
app.post('/search', async(req, res) => {

const englishName = req.body.englishName.join(" ");
const originalName = req.body.originalName;
const browserUrl = "http://127.0.0.1:9222";

    try {
    const browser = await puppeteer.connect({
        browserURL:browserUrl,
        defaultViewport:null
    });
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();


    // Use split degrees (degreesKeywords) array to match non-MD specialties (Nurse, Therapist, etc.) 
    // Still not working
    if (KPinfo.MD_Degree === false) {

        for (let key in KPinfo.degreesKeywords) {
            if(Dictionary.dictionary.hasOwnProperty(KPinfo.degreesKeywords[key])) {
                KPinfo.matchedKeyword = Dictionary.dictionary[KPinfo.degreesKeywords[key]];
                KPinfo.englishMatchedKeyword = KPinfo.degreesKeywords[key];
                break;
            }
        }

            if(originalName === ""){
                await page1.goto(`https://www.google.com/search?q=${englishName}+研究`);
                await page2.goto(`https://www.google.com/search?q=${englishName}+${KPinfo.matchedKeyword}`);
            }  else {
                await page1.goto(`https://www.google.com/search?q=${originalName}+研究`);
                await page2.goto(`https://www.google.com/search?q=${originalName}+${KPinfo.matchedKeyword}`);
            }

    } else {

    // Look for first match of specialty for MD holders with specialty
    for (let key in KPinfo.keywords) {
        if(Dictionary.dictionary.hasOwnProperty(KPinfo.keywords[key])) {
            KPinfo.matchedKeyword = Dictionary.dictionary[KPinfo.keywords[key]];
            KPinfo.englishMatchedKeyword = KPinfo.keywords[key];
            break;
        } 
    }

        if(originalName === ""){
            await page1.goto(`https://www.google.com/search?q=${englishName}+病院`);
            await page2.goto(`https://www.google.com/search?q=${englishName}+${KPinfo.matchedKeyword}`);
        } else {
            await page1.goto(`https://www.google.com/search?q=${originalName}+病院`);
            await page2.goto(`https://www.google.com/search?q=${originalName}+${KPinfo.matchedKeyword}`);
        }

    }

    } catch (error) {
    console.log(error);
    }
                                                                                                                                                                                                                                                                                                                                                                                                        
});


//Route to activate puppeteer for emailSearch function (Incorporate degrees into keyword matching if no specialty?)
app.post('/emailSearch', async(req, res) => {

const { englishName, originalName, PAurl } = req.body;
const englishNameCleaned = englishName.join(" ");
const lastName = englishName.reverse()[0];
const browserUrl = "http://127.0.0.1:9222";


    try {
    const browser = await puppeteer.connect({
        browserURL:browserUrl,
        defaultViewport:null
    });

    const page3 = await browser.newPage();
    const page4 = await browser.newPage();
    const page5 = await browser.newPage();
    const page6 = await browser.newPage();
    const page7 = await browser.newPage();
    const page8 = await browser.newPage();

        
        await page3.goto(`https://www.google.com/search?q=${englishNameCleaned}+${PAurl}`);
        await page4.goto(`https://www.google.com/search?q=${englishNameCleaned}+@+email+${englishMatchedKeyword}`);
        await page5.goto(`https://www.google.com/search?q=${lastName}+@+email+${englishMatchedKeyword}`);
        await page6.goto(`https://www.google.com/search?q=site:www.ncbi.nlm.nih.gov/+${englishNameCleaned}+email`);
        if (originalName !== null || originalName !== "") {
            await page7.goto(`https://www.google.com/search?q=${originalName}+メール`);
            await page8.goto(`https://www.google.com/search?q=${originalName}+${matchedKeyword}+@+email`);
        } else {
            await page7.close();
            await page8.close();
        }



    } catch (error) {
    console.log(error);
    }

});


//Route to activate puppeteer for JTCrossCheck function
app.post('/JTCrossCheck', async(req, res) => {

const englishName = req.body.englishName;
const englishNameCleaned = englishName.join(" ");
const originalName = req.body.originalName;
const browserUrl = "http://127.0.0.1:9222";

    try{
    const browser = await puppeteer.connect({
        browserURL:browserUrl,
        defaultViewport:null
    });
    const page9 = await browser.newPage();
    const page10 = await browser.newPage();

        if(originalName === ""){
            await page9.goto(`https://www.google.com/search?q=${englishNameCleaned}+部長+科長+センター長`);
            await page10.goto(`https://www.google.com/search?q=${englishNameCleaned}+医員+医長`);

        }  else {
            await page9.goto(`https://www.google.com/search?q=${originalName}+部長+科長+センター長`);
            await page10.goto(`https://www.google.com/search?q=${originalName}+医員+医長`);
        }

    } catch (error) {
    console.log(error);
    }

});

app.post('/Reset', () => {
    KPinfo.MD_Degree = false;
    KPinfo.keywords = [];
    KPinfo.degreesKeywords = [];
    KPinfo.matchedKeyword = "";
    KPinfo.englishMatchedKeyword = "";
});


module.exports.app = app;


