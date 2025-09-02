import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { AlertCircle, ArrowBigLeftDash, ArrowBigRightDash, BadgeDollarSign, MapPin, MessageCircle, MessageCircleHeart, Target, Twitter, X } from "lucide-react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "MLB Home Run Tracker" },
    {
      name: "description",
      content:
        "Track every MLB home run by distance, stadium, and team. Explore all 30 ballparks and compare home runs across the league.",
    },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#94cf61] via-green-800 to-gray-900 text-black flex flex-col items-center">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-12 my-12 bg-gray-200 w-[75%] rounded-3xl shadow-lg">
        <h1 className="text-5xl font-extrabold mb-4">
          Distance Tracker
        </h1>
        <p className="text-lg max-w-2xl mb-8 text-gray-700">
          Dive deep into the stunning data behind every home run, including distances, stadiums,
          and player breakdowns across all 30 MLB ballparks.
        </p>
        <div className="flex gap-4">
          <a
            href="/visualization"
            className="relative px-6 py-3 bg-yellow-500 rounded-2xl shadow-lg hover:bg-yellow-500 transition font-semibold text-gray-900 hover:shadow-yellow-700"
          >
            Open Visualizer
          </a>
          <a
            href="#twitter"
            className="relative px-6 py-3 bg-blue-400 rounded-2xl shadow-lg hover:bg-blue-400 transition font-regular text-gray-900 hover:shadow-blue-800"
          >
            Twitter Bot
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:scale-105 transition">
          <MessageCircle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Track Every Home Run</h3>
          <p className="text-gray-300">
            Get real-time updates and historical data on every long ball hit in the last decade.
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:scale-105 transition">
          <Target className="w-12 h-12 text-yellow-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Distance Insights</h3>
          <p className="text-gray-300">
            Compare home run distances across players, teams, and ballparks.
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:scale-105 transition">
          <MapPin className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Ballpark Explorer</h3>
          <p className="text-gray-300">
            Browse interactive data from all 30 MLB stadiums and discover which
            are most home run friendly.
          </p>
        </div>
      </section>


      {/* Twitter Bot Shoutout */}
      <section id="twitter" className="px-6 py-16 bg-gray-200 text-center rounded-3xl shadow-lg max-w-4xl">
        <h2 className="text-3xl font-bold mb-4 flex flex-row items-center justify-center">Follow the Bot! <Twitter className="ml-3" /></h2>
        <p className="text-lg text-gray-800 max-w-2xl mx-auto mb-6">
          I also built{" "}
          <span className="font-semibold text-blue-500"><a
            href="https://twitter.com/DistanceTracker"
            target="_blank"
            rel="noopener noreferrer"
          >@DistanceTracker</a></span>{" "}
          on Twitter, a bot that posts MLB home run visualizations as they happen.
          Stay updated and never miss a long ball!
        </p>
        <a
          href="https://twitter.com/DistanceTracker"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-2xl shadow-lg hover:bg-yellow-300 transition"
        >
          Follow @DistanceTracker
        </a>
      </section>

      <button className="mt-16 mb-8 text-center max-w-xl px-6 text-gray-200 font-medium text-xl flex flex-row items-center justify-center gap-2 underline cursor-pointer" onClick={() => window.open('/visualization')} >
        <div className="animate-bounce">
          <ArrowBigRightDash size={32}/>
        </div>
        What are you waiting for? Start exploring the visualizations today!
        <div className="animate-bounce">
          <ArrowBigLeftDash size={32}/>
        </div>
      </button>
    </div>
  );
}
