import { useState, useEffect} from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'


function App() {
  const [message, setMessage] = useState("Conectando...");

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("No se pudo conectar con la API"));
  }, []);

  return (
    <main>
      <h1>React + Express</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;
