'use client'
import { useRouter } from "next/navigation";
import { categories } from "@/assets/assets";

const CategoriesMarquee = () => {
    const router = useRouter();

    const handleCategoryClick = (category) => {
        router.push(`/shop?category=${encodeURIComponent(category)}`);
    };

    return (
        <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20 my-10 animate-fadeInUp">
            <div className="absolute left-0 top-0 h-full w-10 sm:w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-2 sm:gap-4 transition-all duration-300" >
                {[...categories, ...categories, ...categories, ...categories].map((company, index) => (
                    <button 
                        key={index} 
                        onClick={() => handleCategoryClick(company)}
                        className="px-3 sm:px-5 py-1.5 sm:py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300 hover:shadow-md hover:scale-110 cursor-pointer whitespace-nowrap pointer-events-auto flex-shrink-0"
                    >
                        {company}
                    </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-10 sm:w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
    );
};

export default CategoriesMarquee;