import React, { useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

export const KOLContext = React.createContext();

export const reducer = (state, action) => {

  switch(action.type) {
    case 'setProfileLink':
      return { ...state, profileLink: action.payload};
    case 'setEnglishName':
      return { ...state, englishName: action.payload};
    case 'setOriginalName':
      return { ...state, originalName: action.payload};
    case 'setAffiliation':
      return { ...state, affiliation: action.payload};
    case 'setKeywords':
      return { ...state, keywords: action.payload};
    case 'setDegrees':
      return { ...state, degrees: action.payload};
    case 'setNamesakes':
      return { ...state, namesakes: action.payload};
    case 'setNotes':
      return { ...state, notes: action.payload};
    case 'setKolID':
      return { ...state, kolID: action.payload};
    case 'setEmail':
      return { ...state, email: action.payload};
    case 'setPAurl':
      return { ...state, PAurl: action.payload};
    case 'reset':
      return {englishName:'',
              originalName:'',
              affiliations:'',
              keywords:'',
              degrees:'',
              namesakes:'',
              notes:'',
              kolID:'',
              email:'',
              PAurl:''}; 
    default:
      return console.error('Invalid action');
  }
}

export const StateContext = () => {

  const [info, dispatch] = useReducer(reducer, {
    profileLink:'',
    englishName:'',
    originalName:'',
    affiliations:'',
    keywords:'',
    degrees:'',
    namesakes:'',
    notes:'',
    kolID:'',
    email:'',
    PAurl:''
    });

    return (
    <KOLContext.Provider
      value={{thisState:info, thisDispatch:dispatch}}>
        <App />
    </KOLContext.Provider>
    )

}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <StateContext />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

