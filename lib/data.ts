// lib/data.ts
import { Brain, Database, LineChart, MessageSquare, Code2, GitBranch, LayoutDashboard, BrainCircuit, Activity } from "lucide-react";
// const projects = [
//     {
//         id: 'car-price',
//         title: 'Car Price Prediction & MLOps',
//         description: 'End-to-end machine learning system using CatBoost and MultiQuantile loss. This project is not just a model; it covers a complete MLOps cycle including data collection, cleaning, modeling, and real-time monitoring (Drift Detection). Users can examine the model\'s confidence intervals and Shapley values via the dashboard.',
//         color: 'bg-blue-600',
//         textAccent: 'text-blue-600 dark:text-blue-400',
//         bgAccent: 'bg-blue-50 dark:bg-blue-900/20',
//         borderAccent: 'group-hover:border-blue-500/50',
//         href: '/projects/car-price/dashboard',
//         status: 'Live Demo',
//         features: [
//             { label: 'Analytics Dashboard', icon: LayoutDashboard },
//             { label: 'Price Prediction', icon: BrainCircuit },
//             { label: 'Drift Monitoring', icon: Activity },
//             { label: 'SHAP Explainability', icon: Code2 }
//         ]
//     }
// ];
// export const ALL_PROJECTS = [
//     {
//         id: "car-price",
//         featured: true, // ANA SAYFADA GÖZÜKSÜN MÜ? EVET.
//         href: "/projects/car-price",
//         title: "Car Price Prediction & MLOps",
//         description: "End-to-end machine learning system using CatBoost and MultiQuantile loss. This project is not just a model; it covers a complete MLOps cycle including data collection, cleaning, modeling, and real-time monitoring (Drift Detection). Users can examine the model\'s confidence intervals and Shapley values via the dashboard.",
//         status: "LIVE DEMO",
//         borderAccent: "group-hover:border-blue-500/50 dark:group-hover:border-blue-400/50",
//         bgAccent: "bg-blue-500",
//         textAccent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
//         features: [
//             { label: 'Analytics Dashboard', icon: LayoutDashboard },
//             { label: 'Price Prediction', icon: BrainCircuit },
//             { label: 'Drift Monitoring', icon: Activity },
//             { label: 'SHAP Explainability', icon: Code2 }
//         ],
//     },
//     {
//         id: "ai-chatbot",
//         featured: true, // EVET
//         href: "/projects/chatbot",
//         title: "RAG Powered AI Assistant",
//         description: "A custom LLM chatbot capable of answering domain-specific questions by retrieving information from a vector database.",
//         status: "IN DEVELOPMENT",
//         borderAccent: "group-hover:border-purple-500/50 dark:group-hover:border-purple-400/50",
//         bgAccent: "bg-purple-500",
//         textAccent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
//         features: [
//             { icon: MessageSquare, label: "LangChain" },
//             { icon: Brain, label: "OpenAI" },
//             { icon: Database, label: "Vector DB" },
//         ],
//     },
//     {
//         id: "algo-trading",
//         featured: true, // EVET
//         href: "/projects/trading",
//         title: "Crypto Algorithmic Trading Bot",
//         description: "Automated trading system analyzing market sentiment and technical indicators to execute trades on Binance.",
//         status: "CASE STUDY",
//         borderAccent: "group-hover:border-emerald-500/50 dark:group-hover:border-emerald-400/50",
//         bgAccent: "bg-emerald-500",
//         textAccent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
//         features: [
//             { icon: LineChart, label: "Technical Analysis" },
//             { icon: GitBranch, label: "Automation" },
//         ],
//     },
//     // 4. Proje (Ana sayfada gözükmeyecek ama projeler sayfasında olacak)
//     {
//         id: "old-project",
//         featured: false, // HAYIR
//         href: "/projects/old",
//         title: "Legacy Data Scraper",
//         description: "Simple web scraper built with Selenium.",
//         status: "ARCHIVED",
//         borderAccent: "group-hover:border-slate-500/50",
//         bgAccent: "bg-slate-500",
//         textAccent: "text-slate-600",
//         features: [{ icon: Code2, label: "Selenium" }],
//     }
// ];
export const ALL_PROJECTS = [
    {
        id: "car-price",
        featured: true, // ANA SAYFADA GÖZÜKSÜN MÜ? EVET.
        href: "/projects/car-price",
        title: "Car Price Prediction & MLOps",
        description: "End-to-end machine learning system using CatBoost and MultiQuantile loss. This project is not just a model; it covers a complete MLOps cycle including data collection, cleaning, modeling, and real-time monitoring (Drift Detection). Users can examine the model\'s confidence intervals and Shapley values via the dashboard.",
        status: "LIVE DEMO",
        borderAccent: "group-hover:border-blue-500/50 dark:group-hover:border-blue-400/50",
        bgAccent: "bg-blue-500",
        textAccent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        features: [
            { label: 'Analytics Dashboard', icon: LayoutDashboard },
            { label: 'Price Prediction', icon: BrainCircuit },
            { label: 'Drift Monitoring', icon: Activity },
            { label: 'SHAP Explainability', icon: Code2 }
        ],
    },
];