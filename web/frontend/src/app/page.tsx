import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {
 
  return(
    <div className=' flex flex-col items-center justify-center w-screen h-screen '>
        <img src="/mac2.png" height={200} width={300} alt="" />

        
       <h1 className=' text-center font-extrabold text-9xl '>
         MAC in WIND 
        </h1>


      <Link className='btn !rounded-full  m-14 btn-primary ' href={`/home`}>GO TO DASHBOARD </Link>
    </div>
  )
}
