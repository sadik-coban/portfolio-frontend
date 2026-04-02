// app/analiz/page.js
export default function ReportPage() {
    return (
        <div className="flex flex-col h-screen">
            <header className="p-4 bg-gray-100">
                <h1 className="text-xl font-bold">Analytics Report</h1>
            </header>

            <main className="flex-1 w-full overflow-hidden">
                <iframe
                    src="/car_price_eda_and_training_pipeline.html"
                    className="w-full h-full border-none"
                    title="Jupyter Notebook"
                />
            </main>
        </div>
    );
}