"use client";
import React, { useState, useEffect } from "react";
import {
  MapPin,
  Flag,
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function CourseCard() {
  const [courseData, setCourseData] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [expandedCountries, setExpandedCountries] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("main");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (Object.keys(userProgress).length > 0) {
      localStorage.setItem("golfCourseProgress", JSON.stringify(userProgress));
    }
  }, [userProgress]);

  useEffect(() => {
    localStorage.setItem(
      "expandedCountries",
      JSON.stringify(expandedCountries)
    );
  }, [expandedCountries]);

  function getFullCountryName(shortName) {
    const countryMap = {
      "El Salvador": "El Salvador",
      "French Guiana": "French Guiana",
      "Burkina Faso": "Burkina Faso",
      "Bosnia-Herzegovina": "Bosnia and Herzegovina",
      "Czech Republic": "Czech Republic",
      Netherlands: "Netherlands",
      "New Zealand": "New Zealand",
      "North Macedonia": "North Macedonia",
      "Papua New Guinea": "Papua New Guinea",
      Philippines: "Philippines",
      "Saudi Arabia": "Saudi Arabia",
      "South Africa": "South Africa",
      "South Korea": "South Korea",
      Switzerland: "Switzerland",
      "United Arab Emirates": "United Arab Emirates",
      "United Kingdom": "United Kingdom",
      "United States": "United States",
      "Cape Verde": "Cape Verde",
      China: "China",
      "Democratic Republic of the Congo": "Democratic Republic of the Congo",
      "Ivory Coast": "Ivory Coast",
    };
    return countryMap[shortName] || shortName;
  }

  async function loadInitialData() {
    try {
      // Fetch the file from the public folder
      const response = await fetch("/GarminCourse_290125_v2.xlsx");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Read the response as an ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Use XLSX to read the workbook
      const workbook = XLSX.read(arrayBuffer, { cellDates: true });

      const courses = {};
      workbook.SheetNames.forEach((country) => {
        const worksheet = workbook.Sheets[country];
        const data = XLSX.utils.sheet_to_json(worksheet);
        const fullCountryName = getFullCountryName(country);
        courses[fullCountryName] = data.map((course) => ({
          ...course,
          id: `${country}-${course.Name}-${course.City}`
            .replace(/\s+/g, "-")
            .toLowerCase(),
        }));
      });

      setCourseData(courses);

      const savedProgress = localStorage.getItem("golfCourseProgress");
      if (savedProgress) {
        setUserProgress(JSON.parse(savedProgress));
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading course data:", error);
      setIsLoading(false);
    }
  }

  function getFilteredCourses() {
    return Object.entries(courseData).reduce((acc, [country, courses]) => {
      const filtered = courses.filter((course) => {
        if (
          viewMode === "played" &&
          userProgress[course.id]?.status !== "played"
        )
          return false;
        if (
          viewMode === "wishlist" &&
          userProgress[course.id]?.status !== "wishlist"
        )
          return false;

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            course.Name.toLowerCase().includes(searchLower) ||
            course.City?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });

      if (filtered.length > 0) {
        acc[country] = filtered;
      }
      return acc;
    }, {});
  }

  function updateCourseStatus(courseId, newStatus) {
    setUserProgress((prev) => {
      if (prev[courseId]?.status === newStatus) {
        const { [courseId]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [courseId]: {
          ...prev[courseId],
          status: newStatus,
          photos: prev[courseId]?.photos || [],
          notes: prev[courseId]?.notes || "",
          score: prev[courseId]?.score || "",
          playedDate: newStatus === "played" ? new Date().toISOString() : null,
        },
      };
    });
  }

  // Removed unused updateScore function

  function toggleCountryExpansion(country) {
    setExpandedCountries((prev) => ({
      ...prev,
      [country]: !prev[country],
    }));
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <Globe className="animate-spin mx-auto mb-4" size={48} />
        <p>Loading courses...</p>
      </div>
    );
  }

  const totalCourses = Object.values(courseData).reduce(
    (sum, courses) => sum + courses.length,
    0
  );
  const playedCount = Object.values(userProgress).filter(
    (p) => p.status === "played"
  ).length;
  const wishlistCount = Object.values(userProgress).filter(
    (p) => p.status === "wishlist"
  ).length;
  const filteredCourses = getFilteredCourses();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Flag className="w-8 h-8 text-white transform -rotate-12" />
            </div>
            <h1 className="text-3xl font-bold">CourseCard</h1>
          </div>
        </div>

        {viewMode !== "main" && (
          <button
            onClick={() => {
              setViewMode("main");
              setSearchTerm("");
            }}
            className="flex items-center gap-2 px-4 py-2 mb-4 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
          >
            <ArrowLeft size={20} />
            Return to Menu
          </button>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow-sm text-center">
            <div className="text-2xl font-bold">{totalCourses}</div>
            <div className="text-gray-600">Total Courses</div>
            <div className="text-sm text-gray-500 mt-1">
              {Object.keys(courseData).length} Countries
            </div>
          </div>
          <button
            onClick={() => {
              setViewMode(viewMode === "played" ? "main" : "played");
              setSearchTerm("");
            }}
            className={`p-4 rounded shadow-sm text-center transition-colors ${
              viewMode === "played"
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-green-50 hover:bg-green-100"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                viewMode === "played" ? "text-white" : "text-green-700"
              }`}
            >
              {playedCount}
            </div>
            <div
              className={
                viewMode === "played" ? "text-white" : "text-green-600"
              }
            >
              Played Courses
            </div>
            <div
              className={`text-sm mt-1 ${
                viewMode === "played" ? "text-white" : "text-green-600"
              }`}
            >
              Click to View
            </div>
          </button>
          <button
            onClick={() => {
              setViewMode(viewMode === "wishlist" ? "main" : "wishlist");
              setSearchTerm("");
            }}
            className={`p-4 rounded shadow-sm text-center transition-colors ${
              viewMode === "wishlist"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-blue-50 hover:bg-blue-100"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                viewMode === "wishlist" ? "text-white" : "text-blue-700"
              }`}
            >
              {wishlistCount}
            </div>
            <div
              className={
                viewMode === "wishlist" ? "text-white" : "text-blue-600"
              }
            >
              Wishlist
            </div>
            <div
              className={`text-sm mt-1 ${
                viewMode === "wishlist" ? "text-white" : "text-blue-600"
              }`}
            >
              Click to View
            </div>
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {Object.entries(filteredCourses).map(([country, courses]) => (
        <div key={country} className="mb-6">
          <button
            onClick={() => toggleCountryExpansion(country)}
            className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-3 hover:bg-gray-200"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{country}</h2>
                <p className="text-sm text-gray-600 w-24 text-right">
                  {courses.length} courses
                </p>
              </div>
            </div>
            {expandedCountries[country] ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>

          {expandedCountries[country] && (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 border rounded shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.Name}</h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                        <MapPin size={16} />
                        <span>{course.City}</span>
                        {course.Latitude && course.Longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${course.Latitude},${course.Longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            View on Maps
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                        <Flag size={16} />
                        <span>{course.Holes || 18} holes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => updateCourseStatus(course.id, "played")}
                      className={`flex-1 px-3 py-1 rounded flex items-center justify-center gap-1
                        ${
                          userProgress[course.id]?.status === "played"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      <Check size={16} />
                      Played
                    </button>
                    <button
                      onClick={() => updateCourseStatus(course.id, "wishlist")}
                      className={`flex-1 px-3 py-1 rounded
                        ${
                          userProgress[course.id]?.status === "wishlist"
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
