'use client' 
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Navigation = () => {
    const path = usePathname()
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

    const navItems = [
        { href: '/home', title: 'Home' },
        { href: '/pair', title: 'pair' },
        { href: '/settings', title: 'Settings' },

    ]

    useEffect(() => {
        const activeIndex = navItems.findIndex((item) => item.href === path)

        if (activeIndex !== -1) {
            const el = itemRefs.current[activeIndex]
            if (el) {
                setPillStyle({
                    left: el.offsetLeft,
                    width: el.offsetWidth,
                    opacity: 1,
                })
            }
        } else {
            setPillStyle({ left: 0, width: 0, opacity: 0 })
        }
    }, [path])
    return (
        <div className='fixed top-0 z-[100] w-full buttombar  flex items-center justify-center gap-5 h-[80px] pointer-events-none'>



            <div className='pointer-events-auto backdrop-blur-[12px] bg-[#ffffff08] relative flex items-center p-2 border border-[#d3d3d325]   rounded-full'>

                {pillStyle.opacity === 1 && (
                    <div
                        className="absolute h-[calc(100%-14px)] top-1.5 backdrop-blur-3xl rounded-full bg-[#ffffff1b] transition-all duration-500 ease-in-out -z-10"
                        style={{
                            left: `${pillStyle.left}px`,
                            width: `${pillStyle.width}px`,
                        }}
                    />
                )}

                {navItems.map((item, index) => {
                    const isActive = path === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            ref={(el) => { itemRefs.current[index] = el }}
                            className={`relative px-6 py-2 center flex-col rounded-full transition-all duration-300   ${isActive ? 'text-white' : 'text-[#d3d3d3b4] hover:text-white'
                                }`}
                        >

                            <p className=' text-[13px]  '>
                                {item.title}
                            </p>
                        </Link>
                    )
                })}
            </div>


        </div>

    )
}

export default Navigation