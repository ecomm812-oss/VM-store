import React from 'react'
import Title from './Title'
import { ourSpecsData } from '@/assets/assets'

const OurSpecs = () => {

    return (
        <div className='px-3 sm:px-6 my-12 sm:my-20 max-w-6xl mx-auto animate-fadeInUp overflow-x-hidden'>
            <div className='rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]'>
                <Title visibleButton={false} title='Our Specifications' description="We offer top-tier service and convenience to ensure your shopping experience is smooth, secure and hassle-free." />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7 mt-10 sm:mt-14'>
                {ourSpecsData.map((spec, index) => {
                    const Icon = spec.icon

                    return (
                        <div
                            key={index}
                            className='group relative min-h-[220px] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)] animate-fadeInUp stagger-item'
                            style={{
                                background: `linear-gradient(135deg, ${spec.accent}14 0%, rgba(255,255,255,1) 70%)`,
                                borderColor: `${spec.accent}40`
                            }}
                        >
                            <div className='absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent'></div>

                            <div className='mb-5 flex items-center justify-between'>
                                <div className='flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:scale-110' style={{ backgroundColor: spec.accent, color: '#fff' }}>
                                    <Icon size={22} />
                                </div>
                                <span className='rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500'>
                                    {index + 1}
                                </span>
                            </div>

                            <h3 className='text-lg font-bold text-slate-900'>{spec.title}</h3>
                            <p className='mt-3 text-sm leading-6 text-slate-600'>
                                {spec.description}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default OurSpecs