import React from 'react';
import { Heart, Users, Calendar, ArrowRightCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Home() {
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6 },
    }),
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-24 px-4 bg-gradient-to-br from-blue-100 via-purple-100 to-white rounded-b-3xl shadow-inner">
        <motion.h1
          className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight"
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeIn}
        >
          Make a Difference Through Volunteering
        </motion.h1>
        <motion.p
          className="text-lg text-gray-700 mb-10 max-w-2xl mx-auto"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeIn}
        >
          Connect with meaningful opportunities and organizations that match your passion for creating positive change in your community.
        </motion.p>
        <motion.div
          className="flex gap-4 justify-center"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeIn}
        >
          <a
            href="/register"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:scale-105 transition transform duration-300 shadow-lg"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium border-2 border-blue-600 hover:bg-blue-50 hover:scale-105 transition transform duration-300"
          >
            Sign In
          </a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {[
            {
              icon: <Heart className="w-8 h-8 text-blue-600" />,
              title: "Make an Impact",
              desc: "Contribute your time and skills to causes that matter and create positive change in your community.",
            },
            {
              icon: <Users className="w-8 h-8 text-blue-600" />,
              title: "Connect with Others",
              desc: "Meet like-minded individuals and build meaningful relationships while volunteering.",
            },
            {
              icon: <Calendar className="w-8 h-8 text-blue-600" />,
              title: "Flexible Scheduling",
              desc: "Find opportunities that fit your schedule and make volunteering easy and rewarding.",
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              className="text-center p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300 bg-blue-50 backdrop-blur-sm"
              initial="hidden"
              animate="visible"
              custom={idx}
              variants={fadeIn}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Opportunities Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-white to-blue-50">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Featured Opportunities
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300"
              initial="hidden"
              animate="visible"
              custom={i}
              variants={fadeIn}
            >
              <img
                src={`https://images.unsplash.com/photo-${i === 1 ? '1593113646-4b2b404e25c3' : i === 2 ? '1469571486292-0ba58a3f068b' : '1488521787991-ed7bbaae773c'}?auto=format&fit=crop&w=800&q=80`}
                alt="Volunteer opportunity"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">
                  {i === 1
                    ? 'Community Garden Project'
                    : i === 2
                    ? 'Food Bank Distribution'
                    : 'Youth Mentorship Program'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {i === 1
                    ? 'Help maintain and grow our community garden.'
                    : i === 2
                    ? 'Assist in distributing food to families in need.'
                    : 'Guide and support local youth through mentorship.'}
                </p>
                <a
                  href={`/events/${i}`}
                  className="text-blue-600 font-semibold hover:text-purple-600 transition flex items-center gap-1"
                >
                  Learn More <ArrowRightCircle className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          What Volunteers Say
        </h2>
        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {[
            {
              name: "Anjali R.",
              feedback:
                "Volunteering through this platform changed my life. It helped me find purpose and meet wonderful people.",
            },
            {
              name: "Rahul K.",
              feedback:
                "The flexible events made it super easy to contribute during my college schedule. Highly recommended!",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="bg-blue-50 rounded-xl p-6 shadow hover:shadow-md transition"
              initial="hidden"
              animate="visible"
              custom={i}
              variants={fadeIn}
            >
              <p className="text-gray-700 italic mb-4">“{t.feedback}”</p>
              <h4 className="font-semibold text-gray-900">— {t.name}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call To Action Footer */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-t-3xl shadow-inner">
        <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
        <p className="text-lg mb-6">Join thousands of volunteers and contribute to real change today.</p>
        <a
          href="/register"
          className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold shadow hover:scale-105 transition"
        >
          Join Now
        </a>
      </section>
    </div>
  );
}
