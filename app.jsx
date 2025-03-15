import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login"; // Create a Login.jsx file

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return <h1>Home Page</h1>;
}

export default App;
