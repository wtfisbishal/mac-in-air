'use client' 
import { Laptop } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Navigation = () => {
    const path = usePathname()
    const control = path.startsWith('/control')
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
    const profileRef = useRef<HTMLAnchorElement | null>(null)


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


             <div className='pointer-events-auto backdrop-blur-[12px] glass-panel-dark relative flex items-center p-2 rounded-full'>

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

            {/* Profile Button */}
         { control &&  <div className='pointer-events-auto glass-panel-dark backdrop-blur-[10px] bg-[#ffffff08] relative  border border-[#d3d3d325] w-32 h-12 rounded-full'>
                <Link
                    ref={profileRef}
                    href={path}
                    className={`relative center w-full h-full rounded-full gap-2 flex items-center justify-center  bg-[#ffffff1b] border-none text-white `}>

                    <Laptop  size={20} /> 
                    <p className=' text-sm'> Control</p>

                </Link>
            </div>}


        </div>

    )
}

export default Navigation