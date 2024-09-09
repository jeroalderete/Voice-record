import React from 'react';
import ReactRecorder from './components/ReactRecorder';



const App = () => {

  console.log("hola mundo");
  
  return (
    <div className=' bg-slate-800 h-[100vh] pt-10 text-white ' >
      <ReactRecorder />
    </div>
  );
};

export default App;