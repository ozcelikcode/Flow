/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#6366f1", // Modified as per request
                "secondary": "#64748b",
                "success": "#10b981",
                "danger": "#ef4444",
                "background-light": "#f8fafc",
                "background-dark": "#101122",
                "text-light": "#1e293b",
                "text-dark": "#e2e8f0",
                "text-secondary-light": "#64748b",
                "text-secondary-dark": "#94a3b8",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [],
}
