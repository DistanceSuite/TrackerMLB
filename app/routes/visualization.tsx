// routes/visualization.tsx
import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/visualization";
import { Canvas } from "@react-three/fiber";
import { Gltf, Line, OrbitControls, useGLTF } from '@react-three/drei';
import Papa from "papaparse";
import { Check, LoaderCircle } from "lucide-react";
import { BallArc } from "public/components/BallArc";
import { Vector3 } from "three";

interface Player {
    IDPLAYER: string;
    PLAYERNAME: string;
    BIRTHDATE: string;
    FIRSTNAME: string;
    LASTNAME: string;
    TEAM: string;
    POS: string;
    BATS: string;
    THROWS: string;
    MLBID: string;
    [key: string]: string;
}

interface Hit {
    game_date: string;           // e.g., "2025-08-30"
    player_name: string;         // e.g., "Christian Yelich"
    player_id: string;           // MLBAM player ID
    team_name: string;           // e.g., "MIL"
    team_id: string;             // MLB team ID
    opponent_name: string;       // e.g., "CHC"
    opponent_id: string;         // MLB team ID
    events: string;              // e.g., "single", "double", "home_run", "field_out"
    description: string;         // Play-by-play description
    inning: number;
    at_bat_number: number;
    pitch_number: number;
    pitcher_name: string;
    pitcher_id: string;
    pitch_type: string;
    pitch_speed: number;
    launch_speed: number;
    launch_angle: number;
    hit_distance_sc: number;
    hc_x: number;                // Hit coordinate X
    hc_y: number;                // Hit coordinate Y
    bb_type: string;             // e.g., "fly_ball", "ground_ball"
    stands: string;              // "home" or "away"
    p_throws: string;            // Pitcher throws "R" or "L"
    batter: string;
    pitcher: string;
    home_team: string;
    away_team: string;
    wp_x: number;                // Field position X
    wp_y: number;                // Field position Y
    events_raw?: string;          // Optional raw event info
}


const stadiumOptions = [
    "Stadium_LAA.glb",
    "Stadium_HOU.glb",
    "Stadium_OAK.glb",
    "Stadium_TOR.glb",
    "Stadium_ATL.glb",
    "Stadium_MIL.glb",
    "Stadium_STL.glb",
    "Stadium_CHC.glb",
    "Stadium_AZ.glb",
    "Stadium_LAD.glb",
    "Stadium_SF.glb",
    "Stadium_CLE.glb",
    "Stadium_SEA.glb",
    "Stadium_MIA.glb",
    "Stadium_NYM.glb",
    "Stadium_WSH.glb",
    "Stadium_BAL.glb",
    "Stadium_SD.glb",
    "Stadium_PHI.glb",
    "Stadium_PIT.glb",
    "Stadium_COL.glb",
    "Stadium_KC.glb",
    "Stadium_TEX.glb",
    "Stadium_TB.glb",
    "Stadium_CIN.glb",
    "Stadium_BOS.glb",
    "Stadium_DET.glb",
    "Stadium_MIN.glb",
    "Stadium_CWS.glb",
    "Stadium_NYY.glb",
    "Stadium_NYZ.glb",
    "Stadium_POLO.glb",
    "Stadium_OAK2.glb",
];

const StadiumLookup = {
    Stadium_BOS: "Red Sox, Fenway Park",
    Stadium_NYY: "Yankees, Yankee Stadium",
    Stadium_CHC: "Cubs, Wrigley Field",
    Stadium_LAD: "Dodgers, Dodger Stadium",
    Stadium_SF: "Giants, Oracle Park",
    Stadium_BAL: "Orioles, Camden Yards",
    Stadium_CWS: "White Sox, Guaranteed Rate Field",
    Stadium_TB: "Rays, Tropicana Field",
    Stadium_MIA: "Marlins, LoanDepot Park",
    Stadium_TOR: "Blue Jays, Rogers Centre",
    Stadium_MIN: "Twins, Target Field",
    Stadium_CLE: "Guardians, Progressive Field",
    Stadium_KC: "Royals, Kauffman Stadium",
    Stadium_DET: "Tigers, Comerica Park",
    Stadium_HOU: "Astros, Minute Maid Park",
    Stadium_OAK: "Athletics, Minor League Park",
    Stadium_LAA: "Angels, Angel Stadium",
    Stadium_SEA: "Mariners, T-Mobile Park",
    Stadium_TEX: "Rangers, Globe Life Field",
    Stadium_PIT: "Pirates, PNC Park",
    Stadium_CIN: "Reds, Great American Ball Park",
    Stadium_STL: "Cardinals, Busch Stadium",
    Stadium_MIL: "Brewers, American Family Field",
    Stadium_NYM: "Mets, Citi Field",
    Stadium_PHI: "Phillies, Citizens Bank Park",
    Stadium_WSH: "Nationals, Nationals Park",
    Stadium_NYZ: "Old Yankee Stadium (pre-2009)",
    Stadium_POLO: "Old Polo Grounds (pre-1964)",
    Stadium_SD: "Padres, Petco Park",
    Stadium_COL: "Rockies, Coors Field",
    Stadium_AZ: "Diamondbacks, Chase Field",
    Stadium_OAK2: "Old Oakland Coliseum",
    Stadium_ATL: "Braves, Truist Park"
};

//1 foot is 19.4 units in 3.js
const SCALE = 63.63 / 19.4;


const SEASONS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];

export default function Visualization() {

    const [showTutorial, setShowTutorial] = useState<boolean>(false);

    const [playerData, setPlayerData] = useState<Player[]>([]);

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Player | null>(null);

    const [selectedYear, setSelectedYear] = useState<number>(2025);

    const [currentCandidates, setCurrentCandidates] = useState<Hit[]>([]);
    const [visualizeHits, setVisualizeHits] = useState<Hit[]>([]);

    const [STATE, setSTATE] = useState<"IDLE" | "PARAMETERS" | "SEARCHING" | "CANDIDATES" | "LOADING_STADIUM">("IDLE");

    const [hitOutcome, setHitOutcome] = useState<"Home Run" | "1b/2b/3b/hr" | "1b/2b/3b" | "1b/2b/3b/out" | "Out" | "All">("All");

    const [isDragging, setIsDragging] = useState(false);

    const [currentStadium, setCurrentStadium] = useState<string>(stadiumOptions[0]);

    const [checkedHits, setCheckedHits] = useState<boolean[]>(() =>
        currentCandidates.map(() => false)
    );

    

    const toggleCheck = (index: number) => {
        setCheckedHits(prev => {
            const copy = [...prev];
            copy[index] = !copy[index];
            return copy;
        });
    };

    useEffect(() => {
        Papa.parse("/assets/csv/playerLookup.csv", {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setPlayerData(results.data as Player[]);
            },
        });
    }, []);

    function loadHits() {
        setSTATE("SEARCHING");

        var outcomeText = "";
        switch (hitOutcome) {
            case "All": outcomeText = "single%7Cdouble%7Ctriple%7Chome%5C.%5C.run%7Cfield%5C.%5C.out%7C";
                break;
            case "Home Run": outcomeText = "home%5C.%5C.run%7C";
                break;
            case "1b/2b/3b/hr": outcomeText = "single%7Cdouble%7Ctriple%7Chome%5C.%5C.run%7C";
                break;
            case "1b/2b/3b": outcomeText = "single%7Cdouble%7Ctriple%7C";
                break;
            case "1b/2b/3b/out": outcomeText = "single%7Cdouble%7Ctriple%7Cfield%5C.%5C.out%7C";
                break;
            case "Out": outcomeText = "field%5C.%5C.out%7C";
                break;
        }

        const target = `https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=${outcomeText}&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSea=${selectedYear}%7C&hfSit=&player_type=batter&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=fly%5C.%5C.ball%7Cline%5C.%5C.drive%7C&hfFlag=&metric_1=&group_by=name-date&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=detals&batters_lookup[]=${selected?.MLBID}#results`

        fetch("https://savant-proxy.distancetracker.workers.dev/?target=" +
            encodeURIComponent(
                target
            ))
            .then(res => res.text())
            .then(csv => {
                Papa.parse(csv, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        setCurrentCandidates(results.data as Hit[]);
                        setSTATE("CANDIDATES");
                    },
                });
            }).catch(err => {
                console.error("Error fetching hits:", err);
            });
    }

    const filtered =
        query === ""
            ? []
            : playerData.filter((p) =>
                p.PLAYERNAME.toLowerCase().includes(query.toLowerCase())
            );

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100 pt-10 text-black">
            <div className=" mb-4 bg-gray-50 px-10 py-2 rounded-lg shadow-lg flex gap-5 items-center sticky top-18 z-80">
                <h1 className="text-xl font-semibold">Welcome to the visualizer!</h1>
                <button className="bg-gray-300 border-2 border-gray-700 text-lg px-4 py-1 rounded-md cursor-pointer hover:border-black transition hover:bg-gray-400" onClick={() => setShowTutorial(true)}>Tutorial</button>
                <button className="bg-gray-300 border-2 border-gray-700 text-lg px-4 py-1 rounded-md cursor-pointer hover:border-black transition hover:bg-gray-400" onClick={() => setSTATE("PARAMETERS")}>Search hits</button>
                <select className="bg-gray-300 max-w-50 border-2 border-gray-700 text-lg px-4 py-1 rounded-md cursor-pointer hover:border-black transition hover:bg-gray-200" name="stadiumSelect" value={currentStadium} onChange={(e) => setCurrentStadium(e.target.value)}>
                    {stadiumOptions.map((stadium) => (
                        <option key={stadium} value={stadium}>
                            {StadiumLookup[stadium.replace(".glb", "")] ?? stadium.replace("Stadium_", "").replace(".glb", "")}
                        </option>
                    ))}
                </select>
            </div>
            <div id="canvas-container" className={` w-[80%] h-screen shadow-lg mb-10 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}>
                <Canvas className="rounded-lg bg-sky-300" camera={{ position: [0, 2, 8], fov: 50, far: 5000, near: 0.1 }} shadows>
                    <directionalLight color="white" intensity={1} position={[0, 0, 2]} />
                    <ambientLight intensity={2} />
                    <mesh>
                        <Gltf castShadow receiveShadow scale={SCALE} position={[0, 0, 0]} src={`/assets/stadiums/${currentStadium}`} />
                        {
                            visualizeHits.map((hit, index) => {
                                // Calculate flight path points based on hit data
                                const start = new Vector3(0, 2.5, -0.5); // Bat contact point
                                const distance = hit.hit_distance_sc; // Scale down for visualization
                                const exitVelocity = hit.launch_speed;
                                const hc_x_ = hit.hc_x - 125.42;
                                const hc_y_ = 198.27 - hit.hc_y;
                                const spray = Math.atan(hc_x_ / hc_y_) * -180 / Math.PI * 0.95;
                                const landingZ = Math.cos(spray * (Math.PI / 180)) * distance * -1;
                                const landingX = Math.sin(spray * (Math.PI / 180)) * distance * -1;

                                const launchAngle = hit.launch_angle ? (hit.launch_angle * Math.PI) / 180 : 45 * (Math.PI / 180); // Convert to radians
                                // convert mph to ft/s
                                const v0 = exitVelocity * 1.467; // 1 mph ≈ 1.467 ft/s
                                const g = 32.174; // gravity ft/s^2
                                // vertical component of velocity
                                const vy0 = v0 * Math.sin(launchAngle);

                                // hang time
                                const airTime = (2 * vy0) / g; // seconds

                                // max height above release point
                                const maxHeight = (vy0 * vy0) / (2 * g) * 2.005; // ft

                                const apex = new Vector3(landingX / 2, maxHeight + start.y, landingZ / 2); // Apex of the arc
                                const end = new Vector3(landingX, 1, landingZ); // Landing point 

                                const flightPoints = [start, apex, end];
                                return <BallArc key={index} start={start} apex={apex} end={end} />;
                            })
                        }
                    </mesh>
                    <mesh position={[63, 0, -63]}>
                        <sphereGeometry args={[0.5, 32, 32]} /> {/* radius 0.5, 32 segments */}
                        <meshStandardMaterial color="red" />
                    </mesh>
                    <OrbitControls enablePan={true} enableZoom={true} zoomSpeed={3} panSpeed={2} />
                </Canvas>
            </div>

            {STATE == "PARAMETERS" && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-90">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
                        <h2 className="text-2xl font-bold mb-4">Load Hits</h2>
                        <div className="mb-4">
                            Use the parameters below to load hits into the visualizer:
                            <ul className="list-disc list-inside">
                                <li><strong>Season:</strong> [REQUIRED] set the season for search</li>
                                <li><strong>Player:</strong> [REQUIRED] set the player for search</li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-4 mb-4">
                            <label className="flex flex-col">
                                Season (e.g., 2023):
                                <select className="border border-gray-300 rounded px-2 py-1 mt-1 hover:border-black transition cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                    <option value="">Select Season</option>
                                    {SEASONS.map((season) => (
                                        <option key={season} value={season}>{season}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                Outcome:
                                <select className="border border-gray-300 rounded px-2 py-1 mt-1 hover:border-black transition cursor-pointer" value={hitOutcome} onChange={(e) => setHitOutcome(e.target.value as "Home Run" | "1b/2b/3b/hr" | "1b/2b/3b" | "1b/2b/3b/out" | "Out" | "All")}>
                                    <option value="">Select Outcome</option>
                                    <option value="All">All</option>
                                    <option value="Home Run">Home Run</option>
                                    <option value="1b/2b/3b/hr">1b/2b/3b/hr</option>
                                    <option value="1b/2b/3b">1b/2b/3b</option>
                                    <option value="1b/2b/3b/out">1b/2b/3b/out</option>
                                    <option value="Out">Out</option>
                                </select>
                            </label>
                            <div className="w-80 relative">
                                <label className="flex flex-col">
                                    Player Name (e.g., Mike Trout):
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 mt-1 hover:border-black transition"
                                        placeholder="Start typing..."
                                    />
                                </label>

                                {filtered.length > 0 && (
                                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
                                        {filtered.slice(0, 10).map((p, i) => (
                                            <li
                                                key={i}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    setSelected(p);
                                                    setQuery('');
                                                }}
                                            >
                                                {p.PLAYERNAME} <span className="text-gray-500">({p.TEAM})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {selected && (
                                    <p className="mt-2 text-sm text-green-400">
                                        Selected: {selected.PLAYERNAME} – {selected.POS} ({selected.TEAM})
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer mr-4"
                            onClick={() => {
                                // Implement hit loading logic here
                                loadHits();
                            }}>     Load Hits
                        </button>
                        <button
                            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 cursor-pointer"
                            onClick={() => setSTATE("IDLE")}
                        >     Close
                        </button>
                    </div>
                </div>
            )
            }

            {STATE == "CANDIDATES" && (
                <div className="fixed h-screen top-0 px-6 rounded-lg shadow-lg z-200 flex flex-col items-center justify-center bg-black/80 w-full">
                    <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-20 py-2 shadow-md px-2 rounded-md">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold mb-2">Loaded Hits</h3>
                                <p className="text-sm">Number of hits loaded: {currentCandidates.length}</p>
                            </div>
                            <button className="bg-blue-400 rounded-md px-4 py-2 text-lg cursor-pointer font-semibold hover:bg-blue-500 transition" onClick={() => {
                                if(checkedHits.length > 0)
                                    setCheckedHits([]);
                                else
                                    setCheckedHits(currentCandidates.map(() => true));
                            }}>Toggle All</button>
                            <button className="bg-blue-400 rounded-md px-4 py-2 text-lg cursor-pointer font-semibold hover:bg-blue-500 transition" onClick={() => {
                                setSTATE("LOADING_STADIUM");
                                const selectedHits = currentCandidates.filter((_, index) => checkedHits[index]);
                                setVisualizeHits(selectedHits);
                            }}>Finish</button>
                        </div>
                        <div className=" mt-2">
                            {
                                currentCandidates.map((hit, index) => (
                                    <div key={index} className="border-t border-gray-300 py-2 px-2 rounded-md flex items-center gap-3 cursor-pointer hover:bg-gray-400 transition" onClick={() => toggleCheck(index)}>
                                        {/* Custom checkbox */}
                                        <button
                                            onClick={() => toggleCheck(index)}
                                            className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${checkedHits[index] ? "bg-green-600 border-green-600" : "bg-white border-gray-400 cursor-pointer"
                                                }`}
                                        >
                                            {checkedHits[index] && (
                                                <Check color="white" />
                                            )}
                                        </button>
                                        <p className="text-sm"><strong>Date:</strong> {hit.game_date} | <strong>Opponent:</strong> {hit.opponent_name} | <strong>Event:</strong> {hit.events} | <strong>Distance:</strong> {hit.hit_distance_sc ? `${hit.hit_distance_sc} ft` : 'N/A'}</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )

            }


            {
                showTutorial && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-900 overflow-y-auto max-h-xl">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
                            <h2 className="text-2xl font-bold mb-4">Visualizer Tutorial</h2>
                            <div className="mb-4">
                                Use your mouse to interact with the 3D stadium model:
                                <ul className="list-disc list-inside">
                                    <li><strong>Rotate:</strong> Left-click and drag to rotate the view around the stadium.</li>
                                    <li><strong>Zoom:</strong> Use the scroll wheel to zoom in and out.</li>
                                    <li><strong>Pan:</strong> Right-click and drag to pan the view.</li>
                                </ul>
                            </div>
                            <p className="mb-4">
                                Stadium select:
                                <ul className="list-disc list-inside">
                                    <li>Change the stadium by using the select in the top bar.</li>
                                    <li>Stadiums may take up to 30 seconds to load, no stadium shown while loading</li>
                                </ul>
                            </p>
                            <p className="mb-4">
                                Loading hits:
                                <ul className="list-disc list-inside">
                                    <li><strong>Season:</strong> [REQUIRED] set the season for search.</li>
                                    <li><strong>Player:</strong> [REQUIRED] set the player for search.</li>
                                    <li><strong>Outcome:</strong> Optional, set the outcome of the play.</li>
                                </ul>
                            </p>
                            <p className="mb-4">
                                Once candidates load:
                                <ul className="list-disc list-inside">
                                    <li>Click on hits you wish to include in visualization.</li>
                                    <li>Click toggle all to deselect & select all.</li>
                                    <li>Click finish when satisfied to render hits.</li>
                                </ul>
                            </p>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
                                onClick={() => setShowTutorial(false)}
                            >     Close
                            </button>
                        </div>
                    </div>
                )
            }

            {STATE === "SEARCHING" && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-90">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">Loading Hits...</h2>
                        <p className="mb-4">Please wait while we fetch and process the request data.</p>
                        <LoaderCircle size={46} className="animate-spin" />
                    </div>
                </div>
            )}


        </div>




    );
}
