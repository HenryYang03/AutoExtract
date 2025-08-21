import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BarAnalyzer from './components/BarAnalyzer';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid content mt-4">
          <Link className="navbar-brand" to="/">Analyzer</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/bar_analyzer">Bar Analyzer</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/box_analyzer">Box Analyzer</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/line_analyzer">Line Analyzer</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid content mt-4">
        <Routes>
          <Route path="/bar_analyzer" element={<BarAnalyzer />} />
          {/* Add other analyzer routes here */}
          <Route path="/" element={
            <div>
              <h1>Welcome to the Auto Data Extractor</h1>
              <p>This is an application for extracting data from different types of graphs. Use the navigation bar to switch between different analyzers.</p>
              <ul>
                <li><Link to="/bar_analyzer">Bar Analyzer</Link></li>
                <li><Link to="/box_analyzer">Box Analyzer</Link></li>
                <li><Link to="/line_analyzer">Line Analyzer</Link></li>
              </ul>
            </div>
          } />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="bg-light text-center py-2 mt-4" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        backgroundColor: "white",
        padding: "8px",
        borderTopRightRadius: "10px",
        boxShadow: "2px -2px 5px rgba(0, 0, 0, 0.1)"
      }}>
        <p className="mb-0 small">
          <a href="https://xulab.anat.uci.edu/" target="_blank" rel="noopener noreferrer" className="me-3">
            Xulab
          </a>
          <a href="https://ics.uci.edu/~zhaoxia/" target="_blank" rel="noopener noreferrer" className="me-3">
            Yulab
          </a>
          <a href="https://github.com/HenryYang03/AutoExtract" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </Router>
  );
}

export default App;