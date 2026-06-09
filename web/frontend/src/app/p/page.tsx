const PageNoTWO = () => {
    return (
        <div className="h-screen bodyc w-full flex items-center justify-center  bg-[url('/walpaper.png')] bg-cover bg-center ">
 
            <div className="glassContainer">
                <button type="button" className="glassBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </button>
            </div>

            {/* <svg style="display: none">
                <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
                    <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
                    <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id="btn-glass" primitiveUnits="objectBoundingBox">

                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"></feGaussianBlur>
                    <feDisplacementMap id="disp" in="blur" in2="map" scale="1" xChannelSelector="R" yChannelSelector="G" />
                <feDisplacementMap/>
            </filter>
        </svg> */}

 
    </div >
  )
}

export default PageNoTWO