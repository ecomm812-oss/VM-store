import React from 'react'
import Title from './Title'
import { ourSpecsData } from '@/assets/assets'

const OurSpecs = () => {

    return (
        <div className='px-3 sm:px-6 my-12 sm:my-20 max-w-6xl mx-auto animate-fadeInUp overflow-x-hidden'>
            <Title visibleButton={false} title='Our Specifications' description="We offer top-tier service and convenience to ensure your shopping experience is smooth, secure and hassle-free." />

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7 mt-10 sm:mt-16 lg:mt-26'>
                {
                    ourSpecsData.map((spec, index) => {
                        return (
                            <div className='relative min-h-40 sm:h-44 px-4 sm:px-8 flex flex-col items-center justify-center w-full text-center border rounded-lg group transition-all duration-300 hover-lift card-animate animate-fadeInUp stagger-item' style={{ backgroundColor: spec.accent + 10, borderColor: spec.accent + 30 }} key={index}>
                                <h3 className='text-sm sm:text-base text-slate-800 font-medium transition-colors duration-300'>{spec.title}</h3>
                                <p className='text-xs sm:text-sm text-slate-600 mt-2 sm:mt-3 transition-colors duration-300'>{spec.description}</p>
                                <div className='absolute -top-4 sm:-top-5 text-white size-8 sm:size-10 flex items-center justify-center rounded-md group-hover:scale-125 transition-all duration-300 flex-shrink-0' style={{ backgroundColor: spec.accent }}>
                                    <spec.icon size={18} className='group-hover:animate-spin-custom' />
                                </div>
                            </div>
                        )
                    })
                }
            </div>

        </div>
    )
}

export default OurSpecs