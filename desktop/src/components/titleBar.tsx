// 'use client';

// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// function TitleBar() {
//   const pathname = usePathname();

//   const items = [
//     { label: 'Home', href: '/home' },
//     { label: 'Permissions', href: '/permissions' },
//     { label: 'Pairing', href: '/pairing' }, 
//   ];

//   return (
//     <div
//       className="fixed top-0 left-0 z-50 h-14 w-full flex items-center justify-center backdrop-blur-3xl"
//       style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
//     >
//       <div
//         className=" flex items-center mt-2 glass-panel-dark rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden p-1
//         "
//       >
//         {items.map((item) => {
//           const active = pathname === item.href;

//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
//               className={` px-8 py-1.5 text-sm font-medium transition-all duration-200 rounded-full whitespace-nowrap
//                 ${
//                   active
//                     ? 'bg-white/10 text-white'
//                     : 'text-zinc-400 hover:text-white'
//                 }
//               `}
//             >
//               {item.label}
//             </Link>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// export default TitleBar;


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
        { href: '/permissions', title: 'Permissions' },
        { href: '/pairing', title: 'pairing' },
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

    if(path === '/'){
        return null ;
    }
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

         

        </div>

    )
}

export default Navigation