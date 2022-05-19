import { useContext } from 'react';
import { KOLContext } from './index.js';
import './App.css';



function App() {

const data = useContext(KOLContext);

    //Call to server, copy necessary KP info
    async function Copy () {
    
        data.thisDispatch({type:'reset'});

        const url = data.thisState.profileLink;

        await fetch('http://localhost:4000/copy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({"link":url})
        })
        .then(res => res.json())
        .then(res => {
            data.thisDispatch({type:'setEnglishName', payload: res.englishName});
            data.thisDispatch({type:'setOriginalName', payload: res.originalName});
            data.thisDispatch({type:'setAffiliation', payload: res.commentAffiliations});
            data.thisDispatch({type:'setKeywords', payload: res.keywords.map(elem => `${elem}\n`)});
            data.thisDispatch({type:'setDegrees', payload: res.degrees.map(elem => `${elem}\n`)});
            data.thisDispatch({type:'setKolID', payload: res.kolID});
            data.thisDispatch({type:'setNamesakes', payload: res.namesakes.map(elem => `${elem}\n\n`)});
        })
        .catch(error => alert(error));
        }

    //Call to server, open appropriate tabs for current PA with search parameters to google
    async function Search () {

        await fetch('http://localhost:4000/search', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "englishName":data.thisState.englishName,
                "originalName":data.thisState.originalName,
            })
        })
        .catch(error => alert(error));

        }

    //Reset data fields to empty string
    async function Reset () {
        data.thisDispatch({type:'reset'});

        await fetch('http://localhost:4000/Reset', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .catch(error => alert(error));
    }


    //Reverse input email in the email field
    function ReverseEmail () {

        let rawEmail = data.thisState.email.split('').reverse();
        let fixedEmail = rawEmail.join('');
        data.thisDispatch({type:'setEmail', payload:fixedEmail});

        }

    //Call to server, open appropriate google tab queries for email searching
    async function EmailSearch () {

        await fetch('http://localhost:4000/emailSearch', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({
                "englishName":data.thisState.englishName,
                "originalName":data.thisState.originalName,
                "PAurl":data.thisState.PAurl
            })
        })
        .catch(error => alert(error));

        }

    //Call to server, open appropriate google tab queries for JT crosschecking
    async function JTCrossCheck () {

        await fetch('http://localhost:4000/JTCrossCheck', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({
                "englishName":data.thisState.englishName,
                "originalName":data.thisState.originalName,
                "PAurl":data.thisState.PAurl
            })
        })
        .catch(error => alert(error));

        }

return(
  <div id="overallContainer">
      <div id="profileLinkCase">
          <div id="profileLink">
              <input type="text" id="link" placeholder="Insert profile link/url here" 
                value={data.thisState.profileLink ?? ""} 
                onChange={(e) => data.thisDispatch({type:'setProfileLink', payload: e.target.value})} 
                />
          </div>
          <div id="upperButtonCase">
              <button onClick={Copy}>Copy</button>
              <button onClick={Search}>Search</button>
              <button onClick={Reset}>Reset</button>
          </div>
      </div>

      <div id="inputFields">
      <form id="inputForm">
          <label htmlFor="Names">Name:</label>
          <div id="Names">
                <input type="text" id="EnglishName" placeholder="English name"
                    value={data.thisState.englishName ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setEnglishName', payload: e.target.value})} 
                    />

                <input type="text" id="OriginalName" placeholder="Original name" 
                    value={data.thisState.originalName ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setOriginalName', payload: e.target.value})} 
                    />
          </div>
          <label htmlFor="Affiliations">Past/Present Affiliations:</label>
                <textarea id="Affiliations" 
                    value={data.thisState.affiliation ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setAffiliation', payload: e.target.value})}>
                </textarea>
          <label htmlFor="Keywords">Keywords/Specialties:</label>
                <textarea id="Keywords" 
                    value={data.thisState.keywords ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setKeywords', payload: e.target.value})}>
                </textarea>
          <label htmlFor="Degrees">Degrees:</label>
                <textarea id="Degrees" 
                    value={data.thisState.degrees ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setDegrees', payload: e.target.value})}>
                </textarea>
          <label htmlFor="Namesakes">Namesakes:</label>
                <textarea id="Namesakes" 
                    value={data.thisState.namesakes ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setNamesakes', payload: e.target.value})}>
                </textarea>
          <label htmlFor="Notes">Additional Notes:</label>
                <textarea id="Notes" 
                    value={data.thisState.notes ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setNotes', payload: e.target.value})}>
                </textarea>   
          <label htmlFor="KOL_ID">KOL ID:</label>
                <input type="text" id="KOL_ID" 
                    value={data.thisState.kolID ?? ""} 
                    onChange={(e) => data.thisDispatch({type:'setKolID', payload: e.target.value})} 
                    />                
      </form>
      </div>

      <div id="bottomFields">
          <div id="reverseEmail">
              <input type="text" id="reverseEmailText" placeholder="Insert reversed email" 
                value={data.thisState.email ?? ""} 
                onChange={(e) => data.thisDispatch({type:'setEmail', payload: e.target.value})} 
                />
              <button id="reverseEmailButton" onClick={ReverseEmail}>Un-Reverse e-mail</button>
          </div>
          <div id="PAfields">
              <div id = "PAinput">
                    <input type="text" id="PAurl" placeholder="Insert PA url here"
                      value={data.thisState.PAurl ?? ""}
                      onChange={(e) => data.thisDispatch({type:'setPAurl', payload: e.target.value})} 
                      />
              </div>
              <div id="PAFieldbuttonCase">
                  <button id="emailButton" onClick={EmailSearch}>Search for e-mail</button>
                  <button id="JTButton" onClick={JTCrossCheck}>JT Cross-check</button>
              </div>
          </div>
      </div>
  </div>
)}

export default App;
