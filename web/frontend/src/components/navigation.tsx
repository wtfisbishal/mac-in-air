'use client'
import { useAuth } from '@/hooks/useAuth'
import { useFullscreen } from '@/hooks/useFullscreen'
import { Laptop } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Navigation = () => {
    const path = usePathname()
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })
    const { user, logout } = useAuth();

    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

    const navItems = [
        { href: '/home', title: 'Home' },
        { href: '/settings', title: 'Settings' },
    ]
    const { fullscreen } = useFullscreen();

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


    if (fullscreen) {
        return null;
    }


    return (
        <div className={`   top-0 z-[100] w-full buttombar  flex items-center justify-center max-md:gap-2 gap-5 h-[80px] pointer-events-none `}>
            <div className='pointer-events-auto backdrop-blur-[12px] glass-panel-card relative flex items-center p-2 rounded-full'>

                {pillStyle.opacity === 1 && (
                    <div
                        className="absolute h-[calc(100%-14px)] top-2 backdrop-blur-3xl rounded-full bg-[#ffffff1b] transition-all duration-500 ease-in-out -z-10"
                        style={{
                            left: `${pillStyle.left}px`,
                            width: `${pillStyle.width}px`,
                        }}
                    />
                )}

                {navItems.map((item, index) => {
                    const isActive = path === item.href

                    return (
                        <Link key={item.href} href={item.href} ref={(el) => { itemRefs.current[index] = el }}
                            className={`relative px-4 py-0.5 center flex-col rounded-full transition-all duration-300   ${isActive ? 'text-white' : 'text-[#d3d3d3b4] hover:text-white'}`} >

                            {user && item.href === '/settings' ? <>
                                <Image height={10} width={10} className=' w-10 w-10 rounded-full' src={user.picture!} alt="" />
                            </> : <p className=' text-[13px]'>
                                {item.title}
                            </p>}
                        </Link>
                    )
                })}
            </div>


        </div>

    )
}

export default Navigation