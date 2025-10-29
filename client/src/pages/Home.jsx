import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AiTools from '../components/AiTools'
import Testimonial from '../components/Testimonial'
import Plan from '../components/Plan'
import Footer from '../components/Footer'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <>
      <Navbar />
      <Hero />
      <AiTools />
      <Testimonial />
      <Plan />
      <Footer />
    </>

  )
}

export default Home