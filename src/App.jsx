import React, { useState } from 'react';
import './App.css';

function App() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [controller, setController] = useState(null);
  const [extractEmail, setExtractEmail] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStartExtract = async () => {
    if (isExtracting) {
      try {
        await fetch('http://localhost:5000/stop-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        controller?.abort();
        setIsExtracting(false);
        setProgress(0);
        setEstimatedTime(null);
      } catch (error) {
        console.error('Error stopping extraction:', error);
      }
      return;
    }

    // Check if location is a pincode
    const isPincode = /^\d{6}$/.test(location.trim());
    
    setIsExtracting(true);
    setResults([]);
    setTotalResults(0);
    setProgress(0);
    setStartTime(Date.now());

    const abortController = new AbortController();
    setController(abortController);

    try {
      const response = await fetch('http://localhost:5000/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: keywords,
          location: location,
          isPincode: isPincode,
          total: 100,
          extractEmail
        }),
        signal: abortController.signal
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            const data = JSON.parse(line);
            
            if (data.type === 'update') {
              setResults(prev => [...prev, data.data]);
              setTotalResults(prev => prev + 1);
              setProgress(data.progress);

              if (startTime && data.progress > 0) {
                const elapsedTime = (Date.now() - startTime) / 1000;
                const itemsPerSecond = data.progress / elapsedTime;
                const remainingItems = 100 - data.progress;
                const estimatedSeconds = remainingItems / itemsPerSecond;
                setEstimatedTime(Math.ceil(estimatedSeconds));
              }
            } else if (data.type === 'complete') {
              setProgress(100);
              setEstimatedTime(0);
              break;
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Extraction stopped by user');
      } else {
        console.error('Error:', error);
      }
    } finally {
      setIsExtracting(false);
      setController(null);
      setStartTime(null);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: results }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'google_maps_data.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleClearData = () => {
    setResults([]);
    setTotalResults(0);
  };

  // Add search filter function
  const filteredResults = results.filter(item => {
    if (!searchTerm) return true;
    
    // Convert search term to string and remove spaces
    const search = searchTerm.toString().trim().toLowerCase();
    
    // Check if search is a pincode (6 digits)
    const isPincodeSearch = /^\d{6}$/.test(search);
    
    if (isPincodeSearch) {
      // If searching by pincode, match exactly
      return item.pincode === search;
    } else {
      // Otherwise search in all fields
      return (
        item.name?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search) ||
        item.city?.toLowerCase().includes(search) ||
        item.state?.toLowerCase().includes(search) ||
        item.pincode?.includes(search)
      );
    }
  });

  return (
    <div className="main-container">
      <header>
        <h1>Google Map Extractor</h1>
        <button 
          className="download-excel"
          onClick={handleDownload}
          disabled={results.length === 0}
        >
          <span>⬇️</span> Download Excel
        </button>
      </header>

      <div className="content">
        <div className="sidebar">
          <div className="keyword-section">
            <h3>Keywords (1)</h3>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords..."
            />
          </div>
          <div className="location-section">
            <h3>Location</h3>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location..."
            />
          </div>
          
          {isExtracting && (
            <div className="compact-progress">
              <div className="progress-info">
                <span>{totalResults}/100</span>
                <span>{Math.round(progress)}%</span>
                {estimatedTime > 0 && (
                  <span>{Math.floor(estimatedTime / 60)}m {estimatedTime % 60}s</span>
                )}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="main-content">
          <div className="action-bar">
            <div className="results-badge">
              {totalResults} RESULTS FOUND
            </div>
            <button className="clear-btn" onClick={handleClearData}>Clear Data</button>
            <div className="options-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={extractEmail}
                  onChange={(e) => setExtractEmail(e.target.checked)}
                />
                Extract Email (Slower)
              </label>
            </div>
            <button 
              className="start-extracting-btn"
              onClick={handleStartExtract}
            >
              {isExtracting ? 'Stop Extracting' : 'Start Extracting'}
            </button>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search by pincode or text..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Title</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Website</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  
                  
                  <th>Country Code</th>
                  
                  
                  <th>Pincode</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Address</th>
                  
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item?.name || 'N/A'}</td>
                    <td>{typeof item?.email === 'string' ? item.email : 'N/A'}</td>
                    <td>{item?.phone || 'N/A'}</td>
                    <td>
                      {item?.website && item.website !== 'N/A' ? (
                        <a href={item.website} target="_blank" rel="noopener noreferrer">
                          Visit
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>{item?.category || 'N/A'}</td>
                    <td>{item?.rating || 'N/A'}</td>
                    <td>{item?.reviews ? `(${item.reviews})` : 'N/A'}</td>
                    
                    <td>{item?.countryCode || '+91'}</td>
                    
                    
                    <td>{item?.pincode || 'N/A'}</td>
                    <td>{item?.city || 'N/A'}</td>
                    <td>{item?.state || 'N/A'}</td>
                    <td>{typeof item?.address === 'string' ? item.address : 'N/A'}</td>
                    
                  </tr>
                ))}
              </tbody> 
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;