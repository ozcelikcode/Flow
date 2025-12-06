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
                "primary": "#6366f1",
                "secondary": "#64748b",
                "success": "#10b981",
                "danger": "#ef4444",
                "background-light": "#f8fafc",
                "background-dark": "#000000",
                "surface-dark": "#0a0a0a",
                "text-light": "#1e293b",
                "text-dark": "#f1f5f9",
                "text-secondary-light": "#64748b",
                "text-secondary-dark": "#a1a1aa",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [],
}
