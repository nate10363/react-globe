import React, { useEffect, useRef, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import "./World.css"; // Import the CSS file

const World = () => {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [globeMaterial, setGlobeMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState({
    show: false,
    country: "",
    capital: "",
    continent: "",
    national_dish: "",
    population: "",
  });

  useEffect(() => {
    const imageUrls = [
      "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      "//unpkg.com/three-globe/example/img/earth-topology.png",
      "//unpkg.com/three-globe/example/img/night-sky.png",
      "//unpkg.com/three-globe/example/img/earth-water.png",
    ];

    preloadImages(imageUrls)
      .then(() => {
        const material = new THREE.MeshPhongMaterial();
        material.bumpScale = 10;
        new THREE.TextureLoader().load(
          "//unpkg.com/three-globe/example/img/earth-water.png",
          (texture) => {
            material.specularMap = texture;
            material.specular = new THREE.Color("grey");
            material.shininess = 15;
            setGlobeMaterial(material); // Set the material after textures are loaded
            setLoading(false); // Set loading to false after material is set
          },
          undefined,
          (err) => {
            console.error("Error loading earth-water texture:", err);
          }
        );

        // Ensure globeEl.current is defined before accessing it
        if (globeEl.current) {
          const scene = globeEl.current.scene();
          const light = new THREE.DirectionalLight(0xffffff, Math.PI * 0.8);
          light.position.set(1, 1, 1).normalize();
          scene.add(light);

          const ambientLight = new THREE.AmbientLight(0x404040, Math.PI * 0.8); // soft white light
          scene.add(ambientLight);
        }
      })
      .catch((error) => {
        console.error("Error loading images:", error);
      });
  }, []);

  useEffect(() => {
    fetch("/country-borders.geojson")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data);
      })
      .catch((error) => {
        console.error("Error loading country borders:", error);
      });
  }, []);

  const handleCountryClick = useCallback((country) => {
    setTooltip({
      show: true,
      country: country.properties.SOVEREIGNT || "Unknown",
      capital: country.properties.CAPITAL || "Unknown",
      continent: country.properties.CONTINENT || "Unknown",
      national_dish: country.properties.NATIONAL_DISH || "Unknown",
      population: country.properties.POP_EST
        ? country.properties.POP_EST.toString().replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ","
          )
        : "Unknown",
    });
  }, []);

  const handleGlobeMouseOut = useCallback(() => {
    setTooltip({
      show: false,
      country: "",
      capital: "",
      continent: "",
      national_dish: "",
      population: "",
    });
  }, []);

  const handleSelectClick = useCallback(() => {
    console.log("Selected country:", tooltip.country);
  }, [tooltip.country]);

  if (loading || !globeMaterial || countries.features.length === 0) {
    return <div id="loading-div">Concocting...</div>;
  }

  return (
    <div className="container">
      <div className="top-space"></div> {/* Flexible space that shrinks */}
      <div className="globe-container">
        <Globe
          ref={globeEl}
          globeMaterial={globeMaterial}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          polygonsData={countries.features}
          polygonCapColor={() => "rgba(0, 0, 0, 0)"}
          polygonSideColor={() => "rgba(0, 0, 0, 0)"}
          polygonStrokeColor={() => "#ff0000"}
          polygonLineWidth={0.5}
          onPolygonClick={handleCountryClick}
          onGlobeClick={handleGlobeMouseOut}
          polygonLabel={({ properties: d }) => d.ADMIN}
          width={window.innerWidth} // Ensure the globe fits within the viewport width
          height={window.innerHeight * 0.8} // Adjust height to fit within the viewport height
        />
      </div>
      <div className="bottom-space"></div> {/* Flexible space that shrinks */}
      <div id="tooltip-container">
        <div>
          {tooltip.show && (
            <div className="tooltip">
              <div>
                <strong className="tooltip-country">{tooltip.country}</strong>
              </div>
              <div id="country-sub-info">
                <div>
                  <strong className="country-info-title">Capital:</strong>{" "}
                  {tooltip.capital}
                </div>
                <div>
                  <strong className="country-info-title">Continent:</strong>{" "}
                  <span className="tooltip-sub-text-countryDetails">
                    {tooltip.continent}
                  </span>
                </div>
                <div>
                  <strong className="country-info-title">Population:</strong>{" "}
                  {tooltip.population}
                </div>
                <div>
                  <strong className="country-info-title">National Dish:</strong>{" "}
                  {tooltip.national_dish}
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          {tooltip.show && (
            <button
              className="tooltip-countrySelect-btn"
              onClick={handleSelectClick}
            >
              Explore {tooltip.country}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Function to preload images
const preloadImages = (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = resolve;
      img.onerror = reject;
    });
  });

  return Promise.all(promises);
};

export default World;
