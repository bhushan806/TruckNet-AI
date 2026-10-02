'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'pa' | 'gu';

export interface LanguageOption {
    code: LanguageCode;
    label: string;
    nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
    { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
    { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
    en: {
        // Navigation
        smart_network: 'Smart Trucking Network',
        available_247: 'Available 24/7',
        trucks_online: '1,200+ Trucks Online',
        find_vehicle: 'Find Vehicle',
        road_rules: 'Road Rules',
        for_business: 'For Business',
        pricing: 'Pricing',
        how_it_works: 'How It Works',
        login: 'Log In',
        get_started: 'Get Started Free',
        book_truck: 'Book a Truck Free',
        logout: 'Logout',
        verified_safety: '100% Government Verified Vehicles • Safe Payments',

        // Hero Section
        hero_badge: "INDIA'S SMARTEST TRUCKING & LOGISTICS PLATFORM",
        hero_h1_1: 'Move Smarter.',
        hero_h1_2: 'Drive Further.',
        hero_sub: 'Book verified trucks, track your shipments live on GPS, and get guaranteed transparent rates across India. Fast, secure, and hassle-free.',
        btn_start_free: 'Get Started Free',
        btn_how_it_works: 'How It Works',
        btn_watch_demo: 'Watch 1-Min Demo →',
        trust_bar_label: 'Trusted by 500+ Businesses & Fleets Across India',

        // 3D Terminal / Live Mockup
        live_tracker_title: 'Live Shipment Network',
        live_gps_active: 'Live GPS Active',
        active_shipments: 'ACTIVE SHIPMENTS',
        delivered_count: 'DELIVERED:',
        route_preview: 'Route: Delhi ➔ Mumbai',
        route_savings: 'Saved 2.5 Hours • On Time Delivery',
        recent_trips: 'Recent Trips:',
        trip_delhi_mumbai: 'Delhi → Mumbai — Delivered Safely ✅',
        trip_bengaluru_pune: 'Bengaluru → Pune — On Schedule 🚛',
        trip_ahmedabad_kolkata: 'Ahmedabad → Kolkata — In Transit ⚡',
        trip_chennai_hyd: 'Chennai → Hyderabad — Arrived at Hub 📦',
        trip_jaipur_surat: 'Jaipur → Surat — Completed Successfully ✅',

        // Stats Strip
        stat_trusted: 'Trusted by Businesses & Transporters Across India',
        stat_pan_india: 'SERVING ALL 28 STATES & UNION TERRITORIES',
        stat_km_val: '12 Lakh+ Km',
        stat_km_title: 'Driven Safely',
        stat_km_sub: 'Reliable long-haul trips across national highways',
        stat_trucks_val: '500+',
        stat_trucks_title: 'Verified Trucks & Drivers',
        stat_trucks_sub: '100% background and commercial permit checked',
        stat_ontime_val: '98%',
        stat_ontime_title: 'On-Time Delivery',
        stat_ontime_sub: 'Live GPS tracking and smart route planning',
        stat_savings_val: '₹2.4 Crore',
        stat_savings_title: 'Customer Savings',
        stat_savings_sub: 'Direct truck booking with zero broker commission',

        // Stakeholder Grid
        solutions_badge: 'Solutions for Everyone',
        solutions_title: 'Built for Businesses, Drivers, and Fleet Owners',
        solutions_sub: 'Whether you need to send goods across India, find return loads for your truck, or manage an entire fleet, TruckNet makes it fast, easy, and profitable.',
        
        card_business_title: 'For Businesses & Shippers',
        card_business_sub: 'Send Full Truckloads Anywhere',
        card_business_desc: 'Book verified commercial trucks at honest, upfront prices. Track your cargo in real time from loading to safe delivery.',
        card_business_b1: 'Instant truck booking with transparent, upfront rates',
        card_business_b2: 'Live GPS location tracking directly on your phone',
        card_business_b3: '100% government verified trucks and experienced drivers',
        card_business_b4: 'Safe digital proof of delivery (OTP) upon arrival',
        btn_book_now: 'Book a Truck Now',

        card_driver_title: 'For Truck Drivers',
        card_driver_sub: 'More Loads, Faster Bank Payouts',
        card_driver_desc: 'Never drive back with an empty truck. Get matched with return trips before you even unload, and receive guaranteed fast payment.',
        card_driver_b1: 'Guaranteed return loads so your truck stays earning',
        card_driver_b2: 'Direct bank payment right after safe delivery',
        card_driver_b3: 'TruckNet Dost: Helpful voice assistant in Hindi',
        card_driver_b4: '24/7 emergency roadside support on all national highways',
        btn_join_driver: 'Join as a Driver',

        card_fleet_title: 'For Fleet & Truck Owners',
        card_fleet_sub: 'Keep All Your Trucks Profitable',
        card_fleet_desc: 'Track your whole fleet on one dashboard. Maximize earnings, manage trip expenses, and get direct company loads without broker commissions.',
        card_fleet_b1: 'Real-time live location and trip status of every vehicle',
        card_fleet_b2: 'Automated trip cost and fuel expense tracking',
        card_fleet_b3: 'Direct bookings from verified shippers across India',
        card_fleet_b4: 'Early vehicle maintenance alerts to prevent breakdowns',
        btn_register_fleet: 'Register Your Fleet',

        // How it Works
        hiw_badge: 'Simple 3-Step Process',
        hiw_title: 'How TruckNet Works',
        hiw_sub: 'Booking and managing truck transport has never been this simple, transparent, and secure.',
        hiw_step1_title: 'Post Your Load in 1 Minute',
        hiw_step1_sub: 'Quick & Transparent',
        hiw_step1_desc: 'Enter your pickup city, drop location, and cargo weight. You will receive an instant, fair price estimate with zero hidden broker charges.',
        hiw_step1_hl: 'Instant upfront pricing estimate',

        hiw_step2_title: 'Get a Verified Truck & Driver',
        hiw_step2_sub: 'Government Checked',
        hiw_step2_desc: 'A nearby verified driver accepts your trip. You immediately receive the driver name, phone number, vehicle RC details, and live tracking link.',
        hiw_step2_hl: '100% verified vehicle RC & driver background',

        hiw_step3_title: 'Track Live & Pay on Delivery',
        hiw_step3_sub: 'Safe & Guaranteed',
        hiw_step3_desc: 'Follow your cargo in real time on the map from start to finish. Once your goods arrive safely, confirm with a simple delivery OTP to complete payment.',
        hiw_step3_hl: 'Pay securely only when cargo arrives safely',
        hiw_cta_bar: 'Every trip is backed by verified documents, live GPS tracking, and dedicated support.',

        // Live Demo
        demo_badge: 'Interactive Platform Preview',
        demo_title: 'See How Easy It Is to Book and Track',
        demo_sub: 'Experience our simple booking interface, live route savings, and Hindi voice assistant for drivers.',
        demo_tab1: 'Easy Truck Booking',
        demo_tab2: 'Route & Savings',
        demo_tab3: 'Driver Helper (Hindi)',

        // Trust
        trust_badge: 'Safety, Trust & Peace of Mind',
        trust_title: 'Safe, Verified, and Guaranteed on Every Trip',
        trust_sub: 'We take the stress out of transport. Your cargo is protected by verified drivers, live tracking, and safe payment guarantees.',
        trust_p1_title: '100% Government Verified Trucks',
        trust_p1_desc: 'Every vehicle registration (RC), fitness certificate, insurance, and commercial driving license is verified with official records before dispatch.',
        trust_p2_title: 'Safe & Protected Payments',
        trust_p2_desc: 'Your funds are held securely and released only when your goods are safely delivered and confirmed by your team with a delivery OTP.',
        trust_p3_title: '24/7 Live Support Across India',
        trust_p3_desc: 'Our dedicated operations team is available around the clock to support shippers and drivers at every checkpoint and highway corridor.',
        trust_p4_title: 'Hassle-Free GST & Toll Transit',
        trust_p4_desc: 'All shipments come with digital bills, automated FASTag toll clearance, and instant receipts so your trucks never get delayed at state borders.',

        // Final CTA
        cta_badge: 'Start in 1 Minute',
        cta_title: 'Ready to Move Your Goods Faster & Save Money?',
        cta_sub: 'Join thousands of businesses, transporters, and drivers already using TruckNet for reliable, honest, and stress-free transport across India.',
        cta_btn_book: 'Book a Truck Free',
        cta_btn_track: 'Track or Find Loads',
        cta_b1: '100% Verified Trucks & Drivers',
        cta_b2: 'Zero Hidden Broker Cuts',
        cta_b3: 'Safe Payment on Delivery',

        // Footer
        footer_status: '24/7 Active Transport Services',
        footer_coverage: 'Serving All 28 States Across India',
        footer_helpline: 'Customer Helpline: 1800-TRUCKNET',
        footer_support_sub: 'Instant Support Available',
        footer_desc: "India's easiest and most reliable truck booking platform. We connect businesses with verified trucks, ensuring fair rates, live tracking, and on-time delivery every time.",
        footer_verified: '100% Government Verified Commercial Trucks',
        footer_made_with: 'Made with pride for Indian Transport & Truckers 🇮🇳 🚛',
    },

    hi: {
        // Navigation (हिन्दी)
        smart_network: 'स्मार्ट ट्रक नेटवर्क',
        available_247: '24/7 उपलब्ध',
        trucks_online: '1,200+ ट्रक ऑनलाइन',
        find_vehicle: 'गाड़ी ढूंढें',
        road_rules: 'सड़क नियम',
        for_business: 'व्यापारियों के लिए',
        pricing: 'रेट लिस्ट',
        how_it_works: 'कैसे काम करता है',
        login: 'लॉग इन',
        get_started: 'फ्री शुरू करें',
        book_truck: 'फ्री ट्रक बुक करें',
        logout: 'लॉग आउट',
        verified_safety: '100% सरकारी वेरीफाइड गाड़ियां • सुरक्षित भुगतान',

        // Hero Section
        hero_badge: 'भारत का सबसे भरोसेमंद ट्रक बुकिंग प्लेटफॉर्म',
        hero_h1_1: 'समझदारी से चलें।',
        hero_h1_2: 'आगे बढ़ें।',
        hero_sub: 'सरकारी वेरीफाइड ट्रक बुक करें, मोबाइल पर लाइव जीपीएस देखें, और बिना किसी दलाली के पूरे भारत में सबसे सही रेट पाएं। आसान, सुरक्षित और तेज।',
        btn_start_free: 'फ्री शुरू करें',
        btn_how_it_works: 'कैसे काम करता है',
        btn_watch_demo: '1 मिनट का डेमो देखें →',
        trust_bar_label: 'पूरे भारत में 500+ ट्रांसपोर्टर्स और कंपनियों का भरोसा',

        // 3D Terminal / Live Mockup
        live_tracker_title: 'लाइव ट्रक नेटवर्क',
        live_gps_active: 'लाइव जीपीएस चालू है',
        active_shipments: 'चलती गाड़ियाँ',
        delivered_count: 'सफल डिलीवरी:',
        route_preview: 'रूट: दिल्ली ➔ मुंबई',
        route_savings: '2.5 घंटे की बचत • सही समय पर डिलीवरी',
        recent_trips: 'ताज़ा ट्रिप्स:',
        trip_delhi_mumbai: 'दिल्ली → मुंबई — सुरक्षित डिलीवरी पूरी ✅',
        trip_bengaluru_pune: 'बेंगलुरु → पुणे — रास्ते में सही समय पर 🚛',
        trip_ahmedabad_kolkata: 'अहमदाबाद → कोलकाता — लाइव जीपीएस चालू ⚡',
        trip_chennai_hyd: 'चेन्नई → हैदराबाद — गोदाम पर पहुँच गया 📦',
        trip_jaipur_surat: 'जयपुर → सूरत — सफल डिलीवरी पूरी ✅',

        // Stats Strip
        stat_trusted: 'पूरे भारत के ट्रांसपोर्टर्स और व्यापारियों का पक्का भरोसा',
        stat_pan_india: 'सभी 28 राज्यों और केंद्र शासित प्रदेशों में सेवा चालू',
        stat_km_val: '12 लाख+ किमी',
        stat_km_title: 'सुरक्षित दूरी तय की',
        stat_km_sub: 'राष्ट्रीय राजमार्गों पर सुरक्षित और समय पर डिलीवरी',
        stat_trucks_val: '500+',
        stat_trucks_title: 'वेरीफाइड ट्रक और ड्राइवर',
        stat_trucks_sub: 'आरसी, फिटनेस और ड्राइविंग लाइसेंस की पूरी जांच',
        stat_ontime_val: '98%',
        stat_ontime_title: 'समय पर डिलीवरी',
        stat_ontime_sub: 'लाइव जीपीएस ट्रैकिंग और सबसे सही रूट योजना',
        stat_savings_val: '₹2.4 करोड़',
        stat_savings_title: 'ग्राहकों की कुल बचत',
        stat_savings_sub: 'सीधी बुकिंग — बिना किसी दलाल या बिचौलिये के कट',

        // Stakeholder Grid
        solutions_badge: 'हर किसी के लिए समाधान',
        solutions_title: 'व्यापारियों, ड्राइवरों और फ्लीट मालिकों के लिए खास',
        solutions_sub: 'चाहे आपको पूरे भारत में माल भेजना हो, अपनी गाड़ी के लिए वापसी का लोड चाहिए हो, या पूरी फ्लीट संभालनी हो — TruckNet इसे आसान और मुनाफेदार बनाता है।',

        card_business_title: 'व्यापारियों और कंपनियों के लिए',
        card_business_sub: 'पूरे भारत में कहीं भी पूरा ट्रक भेजें',
        card_business_desc: 'ईमानदार और सही रेट पर वेरीफाइड ट्रक बुक करें। माल लोड होने से लेकर सुरक्षित पहुँचने तक मोबाइल पर लाइव देखें।',
        card_business_b1: 'तुरंत ट्रक बुकिंग, बिना किसी छुपे हुए खर्चे के',
        card_business_b2: 'सीधा अपने फोन पर लाइव जीपीएस लोकेशन देखें',
        card_business_b3: '100% वेरीफाइड ट्रक और अनुभवी ड्राइवर',
        card_business_b4: 'माल पहुँचने पर ओटीपी (OTP) द्वारा सुरक्षित पुष्टि',
        btn_book_now: 'अभी ट्रक बुक करें',

        card_driver_title: 'ट्रक ड्राइवरों के लिए',
        card_driver_sub: 'ज्यादा लोड, सीधा बैंक में तुरंत पैसा',
        card_driver_desc: 'कभी भी खाली गाड़ी लेकर वापस मत लौटो। माल खाली होने से पहले ही वापसी का लोड पाओ, और डिलीवरी होते ही बैंक खाते में पैसा पाओ।',
        card_driver_b1: 'वापसी के लोड की गारंटी — गाड़ी कभी खाली नहीं चलेगी',
        card_driver_b2: 'माल उतारते ही सीधा आपके बैंक खाते में भुगतान',
        card_driver_b3: 'TruckNet दोस्त: हिंदी में बोलकर मदद पाने वाला साथी',
        card_driver_b4: 'सभी हाईवे पर 24/7 इमरजेंसी और क्रेन सहायता',
        btn_join_driver: 'ड्राइवर के रूप में जुड़ें',

        card_fleet_title: 'ट्रांसपोर्टर्स और गाड़ी मालिकों के लिए',
        card_fleet_sub: 'अपनी सभी गाड़ियों को हमेशा चालू और मुनाफे में रखें',
        card_fleet_desc: 'एक ही स्क्रीन पर अपनी सारी गाड़ियाँ देखें। खाली चलना बंद करें, ड्राइवर संभालें, और बिना दलालों को पैसे दिए सीधा लोड पाएं।',
        card_fleet_b1: 'हर गाड़ी की असली लाइव लोकेशन और ट्रिप स्थिति',
        card_fleet_b2: 'डीजल और टोल के खर्च का ऑटोमैटिक हिसाब',
        card_fleet_b3: 'भारत की बड़ी कंपनियों से सीधा पक्का लोड',
        card_fleet_b4: 'गाड़ी खराब होने से पहले सर्विस की चेतावनी',
        btn_register_fleet: 'अपनी फ्लीट रजिस्टर करें',

        // How it Works
        hiw_badge: '3 आसान कदम',
        hiw_title: 'TruckNet कैसे काम करता है',
        hiw_sub: 'ट्रक बुक करना और माल भेजना अब पहले से कहीं ज्यादा आसान, पारदर्शी और सुरक्षित है।',
        hiw_step1_title: '1 मिनट में अपने लोड की जानकारी भरें',
        hiw_step1_sub: 'तेज़ और साफ़',
        hiw_step1_desc: 'कहाँ से माल उठाना है, कहाँ पहुँचाना है और वजन कितना है — यह डालें। आपको तुरंत सही और पक्का रेट दिखाई देगा।',
        hiw_step1_hl: 'तुरंत सही रेट — कोई छुपा हुआ खर्चा नहीं',

        hiw_step2_title: 'वेरीफाइड ट्रक और ड्राइवर पाएं',
        hiw_step2_sub: 'सरकारी रिकॉर्ड जाँचे हुए',
        hiw_step2_desc: 'पास का वेरीफाइड ड्राइवर आपका लोड स्वीकार करता है। आपको ड्राइवर का नाम, फोन नंबर और गाड़ी का आरसी तुरंत मिल जाता है।',
        hiw_step2_hl: 'गाड़ी आरसी और ड्राइवर की 100% जांच',

        hiw_step3_title: 'लाइव जीपीएस देखें और पहुँचने पर भुगतान करें',
        hiw_step3_sub: 'सुरक्षित और पक्का',
        hiw_step3_desc: 'नक्शे पर गाड़ी को चलता हुआ लाइव देखें। जब माल सही सलामत पहुँच जाए, तब एक साधारण ओटीपी बताकर पेमेंट करें।',
        hiw_step3_hl: 'माल सही पहुँचने के बाद ही सुरक्षित पेमेंट',
        hiw_cta_bar: 'हर ट्रिप पर वेरीफाइड कागज, लाइव जीपीएस और 24/7 फोन सहायता उपलब्ध है।',

        // Live Demo
        demo_badge: 'प्लेटफॉर्म का आसान डेमो',
        demo_title: 'देखें कि बुक और ट्रैक करना कितना आसान है',
        demo_sub: 'हमारा आसान बुकिंग पेज, हाईवे पर बचत और ड्राइवरों के लिए हिंदी बोलकर मदद की सुविधा देखें।',
        demo_tab1: 'आसान ट्रक बुकिंग',
        demo_tab2: 'रूट और बचत',
        demo_tab3: 'ड्राइवर साथी (हिंदी)',

        // Trust
        trust_badge: 'सुरक्षा, विश्वास और मन की शांति',
        trust_title: 'हर ट्रिप पर सुरक्षित, वेरीफाइड और पक्की गारंटी',
        trust_sub: 'हम ट्रांसपोर्ट का तनाव खत्म करते हैं। आपका माल वेरीफाइड ड्राइवरों, लाइव ट्रैकिंग और सुरक्षित पेमेंट से सुरक्षित रहता है।',
        trust_p1_title: '100% सरकारी वेरीफाइड गाड़ियां',
        trust_p1_desc: 'हर गाड़ी की आरसी, फिटनेस, बीमा और ड्राइवर का कमर्शियल लाइसेंस सरकारी रिकॉर्ड से जांचा जाता है।',
        trust_p2_title: 'सुरक्षित और गारंटेड पेमेंट',
        trust_p2_desc: 'आपका पैसा सुरक्षित रहता है और तभी दिया जाता है जब माल सही-सलामत पहुँच जाए और आप ओटीपी से पुष्टि करें।',
        trust_p3_title: 'पूरे भारत में 24/7 लाइव कस्टमर केयर',
        trust_p3_desc: 'हमारी टीम दिन-रात हाइवे के हर चेकपॉइंट पर आपकी मदद के लिए फोन पर तैयार रहती है।',
        trust_p4_title: 'बिना रुकावट जीएसटी और टोल पास',
        trust_p4_desc: 'ई-वे बिल और फास्टैग टोल अपने आप क्लियर होते हैं, ताकि आपकी गाड़ी किसी बॉर्डर या टोल पर न फंसे।',

        // Final CTA
        cta_badge: '1 मिनट में शुरू करें',
        cta_title: 'क्या आप तेजी से माल भेजने और पैसे बचाने के लिए तैयार हैं?',
        cta_sub: 'भारत के हजारों व्यापारी, ट्रांसपोर्टर और ड्राइवर आज ही TruckNet से जुड़कर बिना झंझट काम कर रहे हैं।',
        cta_btn_book: 'फ्री ट्रक बुक करें',
        cta_btn_track: 'गाड़ी ट्रैक करें या लोड खोजें',
        cta_b1: '100% वेरीफाइड ट्रक और ड्राइवर',
        cta_b2: 'दलालों का कोई कट नहीं',
        cta_b3: 'माल पहुँचने पर ही सुरक्षित पेमेंट',

        // Footer
        footer_status: '24/7 एक्टिव ट्रांसपोर्ट सेवा',
        footer_coverage: 'पूरे भारत के सभी 28 राज्यों में सेवा',
        footer_helpline: 'हेल्पलाइन नंबर: 1800-TRUCKNET',
        footer_support_sub: 'तुरंत फोन सहायता उपलब्ध',
        footer_desc: 'भारत का सबसे आसान और भरोसेमंद ट्रक बुकिंग प्लेटफॉर्म। हम व्यापारियों को सही गाड़ियों से जोड़ते हैं — सही रेट, लाइव ट्रैकिंग और समय पर डिलीवरी के साथ।',
        footer_verified: '100% सरकारी वेरीफाइड कमर्शियल ट्रक',
        footer_made_with: 'भारतीय ट्रांसपोर्टरों और ट्रक ड्राइवरों के सम्मान में समर्पित 🇮🇳 🚛',
    },

    mr: {
        // Navigation (मराठी)
        smart_network: 'स्मार्ट ट्रकिंग नेटवर्क',
        available_247: '24/7 उपलब्ध',
        trucks_online: '१,२००+ ट्रक ऑनलाइन',
        find_vehicle: 'गाडी शोधा',
        road_rules: 'रस्त्याचे नियम',
        for_business: 'व्यापाऱ्यांसाठी',
        pricing: 'दर पत्रक',
        how_it_works: 'कसे चालते',
        login: 'लॉग इन',
        get_started: 'मोफत सुरू करा',
        book_truck: 'मोफत ट्रक बुक करा',
        logout: 'लॉग आउट',
        verified_safety: '१००% शासकीय पडताळणी झालेल्या गाड्या • सुरक्षित पेमेंट',

        // Hero Section
        hero_badge: 'भारतातील सर्वात विश्वासार्ह ट्रक बुकिंग प्लॅटफॉर्म',
        hero_h1_1: 'हुशारीने चाला.',
        hero_h1_2: 'पुढे जा.',
        hero_sub: 'शासकीय तपासणी झालेले ट्रक बुक करा, मोबाईलवर लाईव्ह जीपीएस बघा, आणि कोणत्याही दलालीशिवाय संपूर्ण भारतात योग्य दर मिळवा. सोपे, सुरक्षित आणि वेगवान.',
        btn_start_free: 'मोफत सुरू करा',
        btn_how_it_works: 'कसे चालते',
        btn_watch_demo: '१ मिनिटाचा डेमो पहा →',
        trust_bar_label: 'संपूर्ण भारतात ५००+ ट्रान्सपोर्टर्स आणि कंपन्यांचा विश्वास',

        // 3D Terminal / Live Mockup
        live_tracker_title: 'लाईव्ह ट्रक नेटवर्क',
        live_gps_active: 'लाईव्ह जीपीएस चालू आहे',
        active_shipments: 'चालू फेऱ्या',
        delivered_count: 'यशस्वी डिलिव्हरी:',
        route_preview: 'मार्ग: दिल्ली ➔ मुंबई',
        route_savings: '२.५ तास वाचले • वेळेवर डिलिव्हरी',
        recent_trips: 'ताजी माहिती:',
        trip_delhi_mumbai: 'दिल्ली → मुंबई — सुरक्षित पोहोचले ✅',
        trip_bengaluru_pune: 'बेंगळुरू → पुणे — वेळेवर मार्गावर 🚛',
        trip_ahmedabad_kolkata: 'अहमदाबाद → कोलकाता — जीपीएस चालू ⚡',
        trip_chennai_hyd: 'चेन्नई → हैदराबाद — गोदामावर पोहोचले 📦',
        trip_jaipur_surat: 'जयपूर → सुरत — यशस्वी पूर्ण ✅',

        // Stats Strip
        stat_trusted: 'संपूर्ण भारतातील ट्रान्सपोर्टर्स आणि व्यापाऱ्यांचा पक्का विश्वास',
        stat_pan_india: 'सर्व २८ राज्ये व केंद्रशासित प्रदेशांत सेवा',
        stat_km_val: '१२ लाख+ किमी',
        stat_km_title: 'सुरक्षित अंतर पार',
        stat_km_sub: 'महामार्गांवर वेळेवर आणि सुरक्षित पोहोच',
        stat_trucks_val: '५००+',
        stat_trucks_title: 'तपासलेले ट्रक आणि चालक',
        stat_trucks_sub: 'आरसी, फिटनेस आणि परवान्याची १००% तपासणी',
        stat_ontime_val: '९८%',
        stat_ontime_title: 'वेळेवर डिलिव्हरी',
        stat_ontime_sub: 'लाईव्ह जीपीएस ट्रॅकिंग आणि योग्य मार्गाचे नियोजन',
        stat_savings_val: '₹२.४ कोटी',
        stat_savings_title: 'ग्राहकांची एकूण बचत',
        stat_savings_sub: 'थेट बुकिंग — मध्यस्थांचे कमिशन पूर्ण बंद',

        // Stakeholder Grid
        solutions_badge: 'सर्वांसाठी सोपे उपाय',
        solutions_title: 'व्यापारी, चालक आणि गाडी मालकांसाठी खास',
        solutions_sub: 'भारतात कुठेही माल पाठवायचा असो, परतीचा लोड मिळवायचा असो, किंवा पूर्ण गाड्यांची फ्लीट चालवायची असो — TruckNet सोपे आणि फायदेशीर करते.',

        card_business_title: 'व्यापारी आणि कंपन्यांसाठी',
        card_business_sub: 'भारतात कुठेही पूर्ण ट्रकने माल पाठवा',
        card_business_desc: 'वाजवी आणि पारदर्शक दरात खात्रीशीर ट्रक मिळवा. माल भरल्यापासून सुरक्षित पोहोचेपर्यंत फोनवर लाईव्ह पहा.',
        card_business_b1: 'कोणत्याही लपविलेल्या खर्चाशिवाय तत्काळ बुकिंग',
        card_business_b2: 'थेट आपल्या फोनवर लाईव्ह जीपीएस लोकेशन',
        card_business_b3: '१००% शासकीय तपासणी झालेले ट्रक आणि अनुभवी चालक',
        card_business_b4: 'माल पोहोचल्यावर ओटीपीद्वारे (OTP) सुरक्षित पावती',
        btn_book_now: 'आता ट्रक बुक करा',

        card_driver_title: 'ट्रक चालकांसाठी',
        card_driver_sub: 'अधिक भाडे, थेट बँकेत तत्काळ पैसे',
        card_driver_desc: 'कधीही रिकामी गाडी घेऊन परतू नका. माल खाली होण्यापूर्वीच परतीचा लोड मिळवा आणि डिलिव्हरी होताच खात्यात पैसे मिळवा.',
        card_driver_b1: 'परतीच्या लोडची खात्री — गाडी कधीही रिकामी फिरणार नाही',
        card_driver_b2: 'माल उतरताच थेट बँकेत पैसे जमा',
        card_driver_b3: 'TruckNet दोस्त: मराठी व हिंदीत बोलून मदत करणारा साथी',
        card_driver_b4: 'हायवेवर २४/७ आपत्कालीन व क्रेन मदत',
        btn_join_driver: 'चालक म्हणून सामील व्हा',

        card_fleet_title: 'गाडी मालकांसाठी (फ्लीट ओनर्स)',
        card_fleet_sub: 'आपल्या सर्व गाड्या सतत धावत्या व फायद्यात ठेवा',
        card_fleet_desc: 'एकाच स्क्रीनवर सर्व गाड्यांचे लोकेशन पहा. रिकामे चालणे थांबवा आणि दलालांशिवाय थेट कंपन्यांकडून काम मिळवा.',
        card_fleet_b1: 'प्रत्येक गाडीचे लाईव्ह लोकेशन व स्थिती',
        card_fleet_b2: 'डिझेल व टोल खर्चाचा आपोआप हिशोब',
        card_fleet_b3: 'मोठ्या कंपन्यांकडून थेट खात्रीशीर काम',
        card_fleet_b4: 'गाडी बिघडण्यापूर्वीच देखभालीची सूचना',
        btn_register_fleet: 'गाड्यांची नोंदणी करा',

        // How it Works
        hiw_badge: '३ सोप्या पायऱ्या',
        hiw_title: 'TruckNet कसे काम करते',
        hiw_sub: 'ट्रक बुक करणे आणि माल पाठवणे आता पूर्वीपेक्षा अधिक सोपे, पारदर्शक आणि सुरक्षित आहे.',
        hiw_step1_title: '१ मिनिटात मालाची माहिती भरा',
        hiw_step1_sub: 'जलद आणि स्पष्ट',
        hiw_step1_desc: 'कुठून माल उचलायचा आणि कुठे न्यायचा हे टाका. लगेचच पारदर्शक दर स्क्रीनवर दिसेल.',
        hiw_step1_hl: 'तत्काळ स्पष्ट दर — कोणतीही लपलेली फी नाही',

        hiw_step2_title: 'तपासलेला ट्रक आणि चालक मिळवा',
        hiw_step2_sub: 'कागदपत्रे तपासलेली',
        hiw_step2_desc: 'जवळचा खात्रीशीर चालक तुमची फेरी स्वीकारतो. चालकाचा फोन नंबर आणि गाडीची माहिती लगेच मिळते.',
        hiw_step2_hl: '१००% तपासलेली आरसी व चालक परवाना',

        hiw_step3_title: 'लाईव्ह पहा आणि माल पोहोचल्यावर पैसे द्या',
        hiw_step3_sub: 'सुरक्षित आणि खात्रीशीर',
        hiw_step3_desc: 'नकाशावर गाडीचा प्रवास थेट पहा. माल सुखरूप पोहोचल्यावर ओटीपी देऊन सुरक्षित पेमेंट पूर्ण करा.',
        hiw_step3_hl: 'माल सुखरूप पोहोचल्यानंतरच सुरक्षित पेमेंट',
        hiw_cta_bar: 'प्रत्येक प्रवासाला लाईव्ह जीपीएस आणि २४/७ फोन साहाय्य उपलब्ध.',

        // Live Demo
        demo_badge: 'प्लॅटफॉर्मचा सोपा डेमो',
        demo_title: 'बुकिंग आणि ट्रॅकिंग किती सोपे आहे ते पहा',
        demo_sub: 'सोपी बुकिंग पद्धत, हायवेवरील बचत आणि चालकांसाठी आवाजी साहाय्यकाचा अनुभव घ्या.',
        demo_tab1: 'सोपे ट्रक बुकिंग',
        demo_tab2: 'मार्ग व बचत',
        demo_tab3: 'चालक साथी (मराठी/हिंदी)',

        // Trust
        trust_badge: 'सुरक्षा आणि पूर्ण विश्वास',
        trust_title: 'प्रत्येक फेरीत सुरक्षिततेची १००% हमी',
        trust_sub: 'आम्ही वाहतुकीची चिंता मिटवतो. तुमचा माल सुरक्षित ड्रायव्हर्स, लाईव्ह जीपीएस आणि सुरक्षित पेमेंटने संरक्षित राहतो.',
        trust_p1_title: '१००% शासकीय तपासणी झालेले ट्रक',
        trust_p1_desc: 'प्रत्येक गाडीची आरसी, फिटनेस, विमा आणि चालकाचा परवाना शासकीय नोंदीतून तपासला जातो.',
        trust_p2_title: 'सुरक्षित पेमेंट हमी',
        trust_p2_desc: 'तुमचे पैसे सुरक्षित असतात आणि माल सुखरूप पोहोचल्याची खात्री झाल्यावरच दिले जातात.',
        trust_p3_title: 'संपूर्ण भारतात २४/७ फोन साहाय्य',
        trust_p3_desc: 'आमची टीम महामार्गावर कोणत्याही अडचणीसाठी २४ तास फोनवर सज्ज असते.',
        trust_p4_title: 'अडचणीशिवाय जीएसटी व टोल पास',
        trust_p4_desc: 'फास्टॅग आणि ई-वे बिल डिजिटल असल्याने गाडी कोणत्याही सीमेवर किंवा टोलवर अडकत नाही.',

        // Final CTA
        cta_badge: '१ मिनिटात सुरू करा',
        cta_title: 'माल वेळेवर पाठवण्यासाठी आणि पैसे वाचवण्यासाठी तयार आहात?',
        cta_sub: 'भारतातील हजारो व्यापारी, ट्रान्सपोर्टर आणि चालक आजच TruckNet वापरून चिंतामुक्त काम करत आहेत.',
        cta_btn_book: 'मोफत ट्रक बुक करा',
        cta_btn_track: 'गाडी ट्रॅक करा किंवा लोड शोधा',
        cta_b1: '१००% तपासलेले ट्रक आणि ड्रायव्हर',
        cta_b2: 'दलाली पूर्णपणे बंद',
        cta_b3: 'माल पोहोचल्यावरच सुरक्षित पेमेंट',

        // Footer
        footer_status: '२४/७ चालू वाहतूक सेवा',
        footer_coverage: 'भारतातील सर्व २८ राज्यांत सेवा',
        footer_helpline: 'हेल्पलाईन नंबर: 1800-TRUCKNET',
        footer_support_sub: 'तातडीने फोन मदत उपलब्ध',
        footer_desc: 'भारतातील सर्वात सोपा व खात्रीशीर ट्रक बुकिंग प्लॅटफॉर्म. योग्य दर, लाईव्ह ट्रॅकिंग आणि वेळेवर माल पोहोचवण्याची खात्री.',
        footer_verified: '१००% शासकीय तपासलेले व्यावसायिक ट्रक',
        footer_made_with: 'भारतीय ट्रान्सपोर्टर्स आणि ट्रक चालकांच्या सन्मानार्थ समर्पित 🇮🇳 🚛',
    },

    pa: {
        // Navigation (ਪੰਜਾਬੀ)
        smart_network: 'ਸਮਾਰਟ ਟਰੱਕ ਨੈੱਟਵਰਕ',
        available_247: '24/7 ਉਪਲਬਧ',
        trucks_online: '1,200+ ਟਰੱਕ ਆਨਲਾਈਨ',
        find_vehicle: 'ਗੱਡੀ ਲੱਭੋ',
        road_rules: 'ਸੜਕ ਦੇ ਨਿਯਮ',
        for_business: 'ਕਾਰੋਬਾਰੀਆਂ ਲਈ',
        pricing: 'ਰੇਟ ਲਿਸਟ',
        how_it_works: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
        login: 'ਲਾਗ ਇਨ',
        get_started: 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ',
        book_truck: 'ਮੁਫ਼ਤ ਟਰੱਕ ਬੁੱਕ ਕਰੋ',
        logout: 'ਲਾਗ ਆਊਟ',
        verified_safety: '100% ਸਰਕਾਰੀ ਜਾਂਚ ਕੀਤੀਆਂ ਗੱਡੀਆਂ • ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ',

        // Hero Section
        hero_badge: 'ਭਾਰਤ ਦਾ ਸਭ ਤੋਂ ਭਰੋਸੇਮੰਦ ਟਰੱਕ ਬੁਕਿੰਗ ਪਲੇਟਫਾਰਮ',
        hero_h1_1: 'ਸਮਝਦਾਰੀ ਨਾਲ ਚੱਲੋ।',
        hero_h1_2: 'ਅੱਗੇ ਵਧੋ।',
        hero_sub: 'ਸਰਕਾਰੀ ਜਾਂਚ ਕੀਤੇ ਟਰੱਕ ਬੁੱਕ ਕਰੋ, ਮੋਬਾਈਲ ਤੇ ਲਾਈਵ ਜੀਪੀਐਸ ਦੇਖੋ, ਅਤੇ ਬਿਨਾਂ ਦਲਾਲੀ ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਸਭ ਤੋਂ ਸਹੀ ਰੇਟ ਪਾਓ। ਸੌਖਾ, ਸੁਰੱਖਿਅਤ ਅਤੇ ਤੇਜ਼।',
        btn_start_free: 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ',
        btn_how_it_works: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
        btn_watch_demo: '1 ਮਿੰਟ ਦਾ ਡੈਮੋ ਵੇਖੋ →',
        trust_bar_label: 'ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ 500+ ਟਰਾਂਸਪੋਰਟਰਾਂ ਅਤੇ ਕੰਪਨੀਆਂ ਦਾ ਭਰੋਸਾ',

        // 3D Terminal / Live Mockup
        live_tracker_title: 'ਲਾਈਵ ਟਰੱਕ ਨੈੱਟਵਰਕ',
        live_gps_active: 'ਲਾਈਵ ਜੀਪੀਐਸ ਚਾਲੂ ਹੈ',
        active_shipments: 'ਚੱਲ ਰਹੇ ਟਰੱਕ',
        delivered_count: 'ਸਫ਼ਲ ਡਿਲੀਵਰੀ:',
        route_preview: 'ਰੂਟ: ਦਿੱਲੀ ➔ ਮੁੰਬਈ',
        route_savings: '2.5 ਘੰਟੇ ਦੀ ਬੱਚਤ • ਸਮੇਂ ਸਿਰ ਡਿਲੀਵਰੀ',
        recent_trips: 'ਤਾਜ਼ਾ ਜਾਣਕਾਰੀ:',
        trip_delhi_mumbai: 'ਦਿੱਲੀ → ਮੁੰਬਈ — ਸੁਰੱਖਿਅਤ ਪਹੁੰਚਿਆ ✅',
        trip_bengaluru_pune: 'ਬੈਂਗਲੁਰੂ → ਪੁਣੇ — ਸਮੇਂ ਸਿਰ ਰਸਤੇ ਵਿੱਚ 🚛',
        trip_ahmedabad_kolkata: 'ਅਹਿਮਦਾਬਾਦ → ਕੋਲਕਾਤਾ — ਜੀਪੀਐਸ ਚਾਲੂ ⚡',
        trip_chennai_hyd: 'ਚੇਨਈ → ਹੈਦਰਾਬਾਦ — ਗੋਦਾਮ ਤੇ ਪਹੁੰਚਿਆ 📦',
        trip_jaipur_surat: 'ਜੈਪੁਰ → ਸੂਰਤ — ਸਫ਼ਲਤਾਪੂਰਵਕ ਪੂਰਾ ✅',

        // Stats Strip
        stat_trusted: 'ਪੂਰੇ ਭਾਰਤ ਦੇ ਟਰਾਂਸਪੋਰਟਰਾਂ ਅਤੇ ਵਪਾਰੀਆਂ ਦਾ ਪੱਕਾ ਭਰੋਸਾ',
        stat_pan_india: 'ਸਾਰੇ 28 ਰਾਜਾਂ ਵਿੱਚ ਸੇਵਾ ਉਪਲਬਧ',
        stat_km_val: '12 ਲੱਖ+ ਕਿਲੋਮੀਟਰ',
        stat_km_title: 'ਸੁਰੱਖਿਅਤ ਸਫ਼ਰ ਤੈਅ ਕੀਤਾ',
        stat_km_sub: 'ਹਾਈਵੇ ਉੱਤੇ ਸਮੇਂ ਸਿਰ ਅਤੇ ਸੁਰੱਖਿਅਤ ਪਹੁੰਚ',
        stat_trucks_val: '500+',
        stat_trucks_title: 'ਜਾਂਚੇ ਹੋਏ ਟਰੱਕ ਅਤੇ ਡਰਾਈਵਰ',
        stat_trucks_sub: 'ਆਰਸੀ, ਫਿਟਨੈਸ ਅਤੇ ਲਾਇਸੈਂਸ ਦੀ ਪੂਰੀ ਜਾਂਚ',
        stat_ontime_val: '98%',
        stat_ontime_title: 'ਸਮੇਂ ਸਿਰ ਡਿਲੀਵਰੀ',
        stat_ontime_sub: 'ਲਾਈਵ ਜੀਪੀਐਸ ਟ੍ਰੈਕਿੰਗ ਅਤੇ ਸਹੀ ਰੂਟ ਯੋਜਨਾ',
        stat_savings_val: '₹2.4 ਕਰੋੜ',
        stat_savings_title: 'ਗਾਹਕਾਂ ਦੀ ਕੁੱਲ ਬੱਚਤ',
        stat_savings_sub: 'ਸਿੱਧੀ ਬੁਕਿੰਗ — ਬਿਨਾਂ ਕਿਸੇ ਵਿਚੋਲੇ ਜਾਂ ਦਲਾਲ ਦੇ ਕੱਟ',

        // Stakeholder Grid
        solutions_badge: 'ਸਭ ਲਈ ਆਸਾਨ ਹੱਲ',
        solutions_title: 'ਵਪਾਰੀਆਂ, ਡਰਾਈਵਰਾਂ ਅਤੇ ਗੱਡੀ ਮਾਲਕਾਂ ਲਈ ਖ਼ਾਸ',
        solutions_sub: 'ਭਾਵੇਂ ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਮਾਲ ਭੇਜਣਾ ਹੋਵੇ, ਵਾਪਸੀ ਦਾ ਲੋਡ ਲੱਭਣਾ ਹੋਵੇ, ਜਾਂ ਪੂਰੀ ਫਲੀਟ ਸੰਭਾਲਣੀ ਹੋਵੇ — TruckNet ਇਸਨੂੰ ਆਸਾਨ ਅਤੇ ਫ਼ਾਇਦੇਮੰਦ ਬਣਾਉਂਦਾ ਹੈ।',

        card_business_title: 'ਵਪਾਰੀਆਂ ਅਤੇ ਕੰਪਨੀਆਂ ਲਈ',
        card_business_sub: 'ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਕਿਤੇ ਵੀ ਪੂਰਾ ਟਰੱਕ ਭੇਜੋ',
        card_business_desc: 'ਸਹੀ ਅਤੇ ਇਮਾਨਦਾਰ ਰੇਟਾਂ ਤੇ ਜਾਂਚੇ ਹੋਏ ਟਰੱਕ ਬੁੱਕ ਕਰੋ। ਮਾਲ ਚੜ੍ਹਨ ਤੋਂ ਲੈ ਕੇ ਪਹੁੰਚਣ ਤੱਕ ਫ਼ੋਨ ਉੱਤੇ ਲਾਈਵ ਵੇਖੋ।',
        card_business_b1: 'ਬਿਨਾਂ ਕਿਸੇ ਲੁਕੇ ਖ਼ਰਚੇ ਦੇ ਤੁਰੰਤ ਬੁਕਿੰਗ',
        card_business_b2: 'ਸਿੱਧਾ ਆਪਣੇ ਫ਼ੋਨ ਉੱਤੇ ਲਾਈਵ ਜੀਪੀਐਸ ਦੇਖੋ',
        card_business_b3: '100% ਸਰਕਾਰੀ ਜਾਂਚ ਕੀਤੇ ਟਰੱਕ ਅਤੇ ਤਜਰਬੇਕਾਰ ਡਰਾਈਵਰ',
        card_business_b4: 'ਮਾਲ ਪਹੁੰਚਣ ਤੇ ਓਟੀਪੀ (OTP) ਨਾਲ ਸੁਰੱਖਿਅਤ ਪੁਸ਼ਟੀ',
        btn_book_now: 'ਹੁਣੇ ਟਰੱਕ ਬੁੱਕ ਕਰੋ',

        card_driver_title: 'ਟਰੱਕ ਡਰਾਈਵਰ ਵੀਰਾਂ ਲਈ',
        card_driver_sub: 'ਵੱਧ ਲੋਡ, ਸਿੱਧਾ ਬੈਂਕ ਵਿੱਚ ਤੁਰੰਤ ਪੈਸਾ',
        card_driver_desc: 'ਕਦੇ ਵੀ ਖ਼ਾਲੀ ਗੱਡੀ ਲੈ ਕੇ ਵਾਪਸ ਨਾ ਆਓ। ਮਾਲ ਖ਼ਾਲੀ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਹੀ ਵਾਪਸੀ ਦਾ ਲੋਡ ਪਾਓ, ਅਤੇ ਡਿਲੀਵਰੀ ਹੁੰਦੇ ਹੀ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ ਲਵੋ।',
        card_driver_b1: 'ਵਾਪਸੀ ਦੇ ਲੋਡ ਦੀ ਗਰੰਟੀ — ਗੱਡੀ ਕਦੇ ਖ਼ਾਲੀ ਨਹੀਂ ਚੱਲੇਗੀ',
        card_driver_b2: 'ਮਾਲ ਉਤਾਰਦੇ ਹੀ ਸਿੱਧਾ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਭੁਗਤਾਨ',
        card_driver_b3: 'TruckNet ਦੋਸਤ: ਪੰਜਾਬੀ ਅਤੇ ਹਿੰਦੀ ਵਿੱਚ ਬੋਲ ਕੇ ਮਦਦ ਕਰਨ ਵਾਲਾ ਸਾਥੀ',
        card_driver_b4: 'ਹਾਈਵੇ ਉੱਤੇ 24/7 ਐਮਰਜੈਂਸੀ ਅਤੇ ਮਦਦ ਸੇਵਾ',
        btn_join_driver: 'ਡਰਾਈਵਰ ਵਜੋਂ ਜੁੜੋ',

        card_fleet_title: 'ਟਰਾਂਸਪੋਰਟਰਾਂ ਅਤੇ ਗੱਡੀ ਮਾਲਕਾਂ ਲਈ',
        card_fleet_sub: 'ਆਪਣੀਆਂ ਸਾਰੀਆਂ ਗੱਡੀਆਂ ਹਮੇਸ਼ਾ ਚੱਲਦੀਆਂ ਤੇ ਫ਼ਾਇਦੇ ਵਿੱਚ ਰੱਖੋ',
        card_fleet_desc: 'ਇੱਕੋ ਸਕ੍ਰੀਨ ਤੇ ਸਾਰੀਆਂ ਗੱਡੀਆਂ ਦੀ ਲੋਕੇਸ਼ਨ ਵੇਖੋ। ਖ਼ਾਲੀ ਚੱਲਣਾ ਬੰਦ ਕਰੋ ਅਤੇ ਬਿਨਾਂ ਦਲਾਲਾਂ ਦੇ ਸਿੱਧਾ ਲੋਡ ਲਵੋ।',
        card_fleet_b1: 'ਹਰ ਗੱਡੀ ਦੀ ਅਸਲ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਅਤੇ ਸਥਿਤੀ',
        card_fleet_b2: 'ਡੀਜ਼ਲ ਅਤੇ ਟੋਲ ਖ਼ਰਚੇ ਦਾ ਆਟੋਮੈਟਿਕ ਹਿਸਾਬ',
        card_fleet_b3: 'ਵੱਡੀਆਂ ਕੰਪਨੀਆਂ ਤੋਂ ਸਿੱਧਾ ਪੱਕਾ ਲੋਡ',
        card_fleet_b4: 'ਗੱਡੀ ਖ਼ਰਾਬ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਸਰਵਿਸ ਦੀ ਚਿਤਾਵਨੀ',
        btn_register_fleet: 'ਆਪਣੀ ਫਲੀਟ ਦਰਜ ਕਰੋ',

        // How it Works
        hiw_badge: '3 ਸੌਖੇ ਕਦਮ',
        hiw_title: 'TruckNet ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
        hiw_sub: 'ਟਰੱਕ ਬੁੱਕ ਕਰਨਾ ਅਤੇ ਮਾਲ ਭੇਜਣਾ ਹੁਣ ਪਹਿਲਾਂ ਨਾਲੋਂ ਕਿਤੇ ਵੱਧ ਸੌਖਾ, ਸਾਫ਼ ਅਤੇ ਸੁਰੱਖਿਅਤ ਹੈ।',
        hiw_step1_title: '1 ਮਿੰਟ ਵਿੱਚ ਆਪਣੇ ਲੋਡ ਦੀ ਜਾਣਕਾਰੀ ਭਰੋ',
        hiw_step1_sub: 'ਤੇਜ਼ ਅਤੇ ਸਾਫ਼',
        hiw_step1_desc: 'ਕਿੱਥੋਂ ਮਾਲ ਚੁੱਕਣਾ ਹੈ ਅਤੇ ਕਿੱਥੇ ਪਹੁੰਚਾਉਣਾ ਹੈ — ਇਹ ਭਰੋ। ਤੁਹਾਨੂੰ ਤੁਰੰਤ ਸਹੀ ਰੇਟ ਮਿਲ ਜਾਵੇਗਾ।',
        hiw_step1_hl: 'ਤੁਰੰਤ ਸਾਫ਼ ਰੇਟ — ਕੋਈ ਲੁਕਿਆ ਖ਼ਰਚਾ ਨਹੀਂ',

        hiw_step2_title: 'ਜਾਂਚਿਆ ਹੋਇਆ ਟਰੱਕ ਅਤੇ ਡਰਾਈਵਰ ਮਿਲੇਗਾ',
        hiw_step2_sub: 'ਸਰਕਾਰੀ ਕਾਗ਼ਜ਼ ਜਾਂਚੇ ਹੋਏ',
        hiw_step2_desc: 'ਨੇੜੇ ਦਾ ਭਰੋਸੇਮੰਦ ਡਰਾਈਵਰ ਲੋਡ ਸਵੀਕਾਰ ਕਰਦਾ ਹੈ। ਡਰਾਈਵਰ ਦਾ ਨੰਬਰ ਅਤੇ ਗੱਡੀ ਦੀ ਜਾਣਕਾਰੀ ਤੁਰੰਤ ਮਿਲਦੀ ਹੈ।',
        hiw_step2_hl: 'ਗੱਡੀ ਆਰਸੀ ਅਤੇ ਡਰਾਈਵਰ ਦੀ 100% ਜਾਂਚ',

        hiw_step3_title: 'ਲਾਈਵ ਜੀਪੀਐਸ ਦੇਖੋ ਅਤੇ ਪਹੁੰਚਣ ਤੇ ਭੁਗਤਾਨ ਕਰੋ',
        hiw_step3_sub: 'ਸੁਰੱਖਿਅਤ ਅਤੇ ਪੱਕਾ',
        hiw_step3_desc: 'ਨਕਸ਼ੇ ਉੱਤੇ ਗੱਡੀ ਨੂੰ ਚੱਲਦਾ ਹੋਇਆ ਲਾਈਵ ਦੇਖੋ। ਜਦੋਂ ਮਾਲ ਸਹੀ ਪਹੁੰਚ ਜਾਵੇ ਤਾਂ ਓਟੀਪੀ ਦੇ ਕੇ ਪੇਮੈਂਟ ਕਰੋ।',
        hiw_step3_hl: 'ਮਾਲ ਸੁਰੱਖਿਅਤ ਪਹੁੰਚਣ ਤੋਂ ਬਾਅਦ ਹੀ ਭੁਗਤਾਨ',
        hiw_cta_bar: 'ਹਰ ਫੇਰੀ ਤੇ ਸਰਕਾਰੀ ਕਾਗ਼ਜ਼, ਲਾਈਵ ਜੀਪੀਐਸ ਅਤੇ 24/7 ਫ਼ੋਨ ਸਹਾਇਤਾ ਮੌਜੂਦ ਹੈ।',

        // Live Demo
        demo_badge: 'ਪਲੇਟਫਾਰਮ ਦਾ ਸੌਖਾ ਡੈਮੋ',
        demo_title: 'ਦੇਖੋ ਕਿ ਬੁੱਕ ਅਤੇ ਟ੍ਰੈਕ ਕਰਨਾ ਕਿੰਨਾ ਆਸਾਨ ਹੈ',
        demo_sub: 'ਸਾਡੀ ਸੌਖੀ ਬੁਕਿੰਗ, ਹਾਈਵੇ ਉੱਤੇ ਬੱਚਤ ਅਤੇ ਡਰਾਈਵਰਾਂ ਲਈ ਆਵਾਜ਼ੀ ਮਦਦ ਦਾ ਤਜ਼ਰਬਾ ਲਵੋ।',
        demo_tab1: 'ਸੌਖੀ ਟਰੱਕ ਬੁਕਿੰਗ',
        demo_tab2: 'ਰੂਟ ਅਤੇ ਬੱਚਤ',
        demo_tab3: 'ਡਰਾਈਵਰ ਦੋਸਤ (ਹਿੰਦੀ/ਪੰਜਾਬੀ)',

        // Trust
        trust_badge: 'ਸੁਰੱਖਿਆ, ਭਰੋਸਾ ਅਤੇ ਸ਼ਾਂਤੀ',
        trust_title: 'ਹਰ ਫੇਰੀ ਤੇ ਸੁਰੱਖਿਅਤ ਅਤੇ ਪੱਕੀ ਗਰੰਟੀ',
        trust_sub: 'ਅਸੀਂ ਟਰਾਂਸਪੋਰਟ ਦੀ ਚਿੰਤਾ ਖ਼ਤਮ ਕਰਦੇ ਹਾਂ। ਤੁਹਾਡਾ ਮਾਲ ਜਾਂਚੇ ਹੋਏ ਡਰਾਈਵਰਾਂ ਅਤੇ ਲਾਈਵ ਜੀਪੀਐਸ ਨਾਲ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ।',
        trust_p1_title: '100% ਸਰਕਾਰੀ ਜਾਂਚ ਕੀਤੇ ਟਰੱਕ',
        trust_p1_desc: 'ਹਰ ਗੱਡੀ ਦੀ ਆਰਸੀ, ਫਿਟਨੈਸ ਅਤੇ ਡਰਾਈਵਰ ਦਾ ਲਾਇਸੈਂਸ ਸਰਕਾਰੀ ਰਿਕਾਰਡ ਨਾਲ ਜਾਂਚਿਆ ਜਾਂਦਾ ਹੈ।',
        trust_p2_title: 'ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ ਗਰੰਟੀ',
        trust_p2_desc: 'ਤੁਹਾਡਾ ਪੈਸਾ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ ਅਤੇ ਮਾਲ ਸਹੀ ਪਹੁੰਚਣ ਦੀ ਪੁਸ਼ਟੀ ਤੋਂ ਬਾਅਦ ਹੀ ਦਿੱਤਾ ਜਾਂਦਾ ਹੈ।',
        trust_p3_title: 'ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ 24/7 ਲਾਈਵ ਹੈਲਪਲਾਈਨ',
        trust_p3_desc: 'ਸਾਡੀ ਟੀਮ ਹਰ ਸਮੇਂ ਹਾਈਵੇ ਤੇ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਫ਼ੋਨ ਉੱਤੇ ਤਿਆਰ ਰਹਿੰਦੀ ਹੈ।',
        trust_p4_title: 'ਬਿਨਾਂ ਰੁਕਾਵਟ ਜੀਐਸਟੀ ਅਤੇ ਟੋਲ ਪਾਸ',
        trust_p4_desc: 'ਫਾਸਟੈਗ ਅਤੇ ਈ-ਵੇ ਬਿੱਲ ਡਿਜੀਟਲ ਹੋਣ ਕਰਕੇ ਗੱਡੀ ਕਿਸੇ ਟੋਲ ਜਾਂ ਬਾਰਡਰ ਤੇ ਨਹੀਂ ਰੁਕਦੀ।',

        // Final CTA
        cta_badge: '1 ਮਿੰਟ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ',
        cta_title: 'ਕੀ ਤੁਸੀਂ ਮਾਲ ਤੇਜ਼ੀ ਨਾਲ ਭੇਜਣ ਅਤੇ ਪੈਸੇ ਬਚਾਉਣ ਲਈ ਤਿਆਰ ਹੋ?',
        cta_sub: 'ਭਾਰਤ ਦੇ ਹਜ਼ਾਰਾਂ ਵਪਾਰੀ, ਟਰਾਂਸਪੋਰਟਰ ਅਤੇ ਡਰਾਈਵਰ ਅੱਜ ਹੀ TruckNet ਨਾਲ ਬਿਨਾਂ ਝੰਜਟ ਕੰਮ ਕਰ ਰਹੇ ਹਨ।',
        cta_btn_book: 'ਮੁਫ਼ਤ ਟਰੱਕ ਬੁੱਕ ਕਰੋ',
        cta_btn_track: 'ਗੱਡੀ ਟ੍ਰੈਕ ਕਰੋ ਜਾਂ ਲੋਡ ਲੱਭੋ',
        cta_b1: '100% ਜਾਂਚੇ ਹੋਏ ਟਰੱਕ ਅਤੇ ਡਰਾਈਵਰ',
        cta_b2: 'ਦਲਾਲਾਂ ਦਾ ਕੋਈ ਕੱਟ ਨਹੀਂ',
        cta_b3: 'ਮਾਲ ਪਹੁੰਚਣ ਤੇ ਹੀ ਸੁਰੱਖਿਅਤ ਭੁਗਤਾਨ',

        // Footer
        footer_status: '24/7 ਚਾਲੂ ਟਰਾਂਸਪੋਰਟ ਸੇਵਾ',
        footer_coverage: 'ਭਾਰਤ ਦੇ ਸਾਰੇ 28 ਰਾਜਾਂ ਵਿੱਚ ਸੇਵਾ',
        footer_helpline: 'ਹੈਲਪਲਾਈਨ ਨੰਬਰ: 1800-TRUCKNET',
        footer_support_sub: 'ਤੁਰੰਤ ਫ਼ੋਨ ਸਹਾਇਤਾ ਉਪਲਬਧ',
        footer_desc: 'ਭਾਰਤ ਦਾ ਸਭ ਤੋਂ ਸੌਖਾ ਅਤੇ ਭਰੋਸੇਮੰਦ ਟਰੱਕ ਬੁਕਿੰਗ ਪਲੇਟਫਾਰਮ। ਸਹੀ ਰੇਟ, ਲਾਈਵ ਟ੍ਰੈਕਿੰਗ ਅਤੇ ਸਮੇਂ ਸਿਰ ਪਹੁੰਚ ਦੀ ਗਰੰਟੀ।',
        footer_verified: '100% ਸਰਕਾਰੀ ਜਾਂਚ ਕੀਤੇ ਵਪਾਰਕ ਟਰੱਕ',
        footer_made_with: 'ਭਾਰਤੀ ਟਰਾਂਸਪੋਰਟਰਾਂ ਅਤੇ ਟਰੱਕ ਡਰਾਈਵਰਾਂ ਦੇ ਮਾਣ ਵਿੱਚ ਸਮਰਪਿਤ 🇮🇳 🚛',
    },

    gu: {
        // Navigation (ગુજરાતી)
        smart_network: 'સ્માર્ટ ટ્રકિંગ નેટવર્ક',
        available_247: '24/7 ઉપલબ્ધ',
        trucks_online: '1,200+ ટ્રક ઓનલાઇન',
        find_vehicle: 'ગાડી શોધો',
        road_rules: 'રસ્તાના નિયમો',
        for_business: 'વેપારીઓ માટે',
        pricing: 'ભાવ પત્રક',
        how_it_works: 'કેવી રીતે કામ કરે છે',
        login: 'લૉગ ઇન',
        get_started: 'મફત શરૂ કરો',
        book_truck: 'મફત ટ્રક બુક કરો',
        logout: 'લૉગ આઉટ',
        verified_safety: '100% સરકારી ચકાસાયેલ વાહનો • સુરક્ષિત ચુકવણી',

        // Hero Section
        hero_badge: 'ભારતનું સૌથી વિશ્વસનીય ટ્રક બુકિંગ પ્લેટફોર્મ',
        hero_h1_1: 'સમજદારીથી ચાલો.',
        hero_h1_2: 'આગળ વધો.',
        hero_sub: 'સરકારી ચકાસાયેલ ટ્રક બુક કરો, મોબાઈલ પર લાઈવ જીપીએસ જુઓ, અને કોઈપણ દલાલી વગર આખા ભારતમાં સાચા ભાવ મેળવો. સરળ, સુરક્ષિત અને ઝડપી.',
        btn_start_free: 'મફત શરૂ કરો',
        btn_how_it_works: 'કેવી રીતે કામ કરે છે',
        btn_watch_demo: '1 મિનિટનો ડેમો જુઓ →',
        trust_bar_label: 'આખા ભારતમાં 500+ ટ્રાન્સપોર્ટર્સ અને કંપનીઓનો વિશ્વાસ',

        // 3D Terminal / Live Mockup
        live_tracker_title: 'લાઈવ ટ્રક નેટવર્ક',
        live_gps_active: 'લાઈવ જીપીએસ ચાલુ છે',
        active_shipments: 'ચાલુ ફેરીઓ',
        delivered_count: 'સફળ ડિલિવરી:',
        route_preview: 'રૂટ: દિલ્હી ➔ મુંબઈ',
        route_savings: '2.5 કલાકની બચત • સમયસર ડિલિવરી',
        recent_trips: 'તાજા સમાચાર:',
        trip_delhi_mumbai: 'દિલ્હી → મુંબઈ — સુરક્ષિત ડિલિવરી પૂર્ણ ✅',
        trip_bengaluru_pune: 'બેંગલુરુ → પુણે — સમયસર માર્ગ પર 🚛',
        trip_ahmedabad_kolkata: 'અમદાવાદ → કોલકાતા — જીપીએસ ચાલુ ⚡',
        trip_chennai_hyd: 'ચેન્નાઈ → હૈદરાબાદ — ગોદામ પર પહોંચ્યું 📦',
        trip_jaipur_surat: 'જયપુર → સુરત — સફળતાપૂર્વક પૂર્ણ ✅',

        // Stats Strip
        stat_trusted: 'સમગ્ર ભારતના ટ્રાન્સપોર્ટર્સ અને વેપારીઓનો પાકો વિશ્વાસ',
        stat_pan_india: 'તમામ 28 રાજ્યોમાં સેવા ઉપલબ્ધ',
        stat_km_val: '12 લાખ+ કિમી',
        stat_km_title: 'સુરક્ષિત અંતર કાપ્યું',
        stat_km_sub: 'હાઇવે પર સમયસર અને સુરક્ષિત ડિલિવરી',
        stat_trucks_val: '500+',
        stat_trucks_title: 'ચકાસાયેલ ટ્રક અને ડ્રાઈવર',
        stat_trucks_sub: 'આરસી, ફિટનેસ અને લાયસન્સની સંપૂર્ણ ચકાસણી',
        stat_ontime_val: '98%',
        stat_ontime_title: 'સમયસર ડિલિવરી',
        stat_ontime_sub: 'લાઈવ જીપીએસ ટ્રેકિંગ અને સાચો રૂટ પ્લાન',
        stat_savings_val: '₹2.4 કરોડ',
        stat_savings_title: 'ગ્રાહકોની કુલ બચત',
        stat_savings_sub: 'સીધી બુકિંગ — દલાલોનું કમિશન સંપૂર્ણ બંધ',

        // Stakeholder Grid
        solutions_badge: 'દરેક માટે સરળ ઉકેલ',
        solutions_title: 'વેપારીઓ, ડ્રાઇવરો અને વાહન માલિકો માટે ખાસ',
        solutions_sub: 'આખા ભારતમાં માલ મોકલવો હોય, પરત આવવાનો લોડ મેળવવો હોય, કે સંપૂર્ણ ફ્લીટ સંભાળવી હોય — TruckNet તેને સરળ અને ફાયદાકારક બનાવે છે.',

        card_business_title: 'વેપારીઓ અને કંપનીઓ માટે',
        card_business_sub: 'ભારતમાં ગમે ત્યાં આખો ટ્રક ભરીને માલ મોકલો',
        card_business_desc: 'વાજબી અને સાચા ભાવે ચકાસાયેલ ટ્રક બુક કરો. માલ ભરવાથી લઈને સુરક્ષિત પહોંચવા સુધી ફોન પર લાઈવ જુઓ.',
        card_business_b1: 'કોઈપણ છુપા ખર્ચ વગર ત્વરિત બુકિંગ',
        card_business_b2: 'સીધા તમારા ફોન પર લાઈવ જીપીએસ લોકેશન',
        card_business_b3: '100% સરકારી ચકાસાયેલ ટ્રક અને અનુભવી ડ્રાઇવર',
        card_business_b4: 'માલ પહોંચવા પર ઓટીપી (OTP) દ્વારા સુરક્ષિત પુષ્ટિ',
        btn_book_now: 'હમણાં ટ્રક બુક કરો',

        card_driver_title: 'ટ્રક ડ્રાઈવર ભાઈઓ માટે',
        card_driver_sub: 'વધુ લોડ, સીધા બેંકમાં ત્વરિત પૈસા',
        card_driver_desc: 'ક્યારેય ખાલી ગાડી લઈને પાછા ન આવો. માલ ખાલી થતાં પહેલાં જ પરત લોડ મેળવો અને ડિલિવરી થતાં જ બેંકમાં પૈસા મેળવો.',
        card_driver_b1: 'પરત લોડની ગેરંટી — ગાડી ક્યારેય ખાલી નહીં દોડે',
        card_driver_b2: 'માલ ખાલી થતાં જ સીધા બેંક ખાતામાં ચુકવણી',
        card_driver_b3: 'TruckNet દોસ્ત: ગુજરાતી/હિન્દીમાં બોલીને મદદ કરતો સાથી',
        card_driver_b4: 'હાઇવે પર 24/7 ઇમરજન્સી અને રોડસાઇડ મદદ',
        btn_join_driver: 'ડ્રાઈવર તરીકે જોડાઓ',

        card_fleet_title: 'ટ્રાન્સપોર્ટર્સ અને વાહન માલિકો માટે',
        card_fleet_sub: 'તમારી બધી ગાડીઓ સતત ચાલુ અને નફામાં રાખો',
        card_fleet_desc: 'એક જ સ્ક્રીન પર તમામ ગાડીઓનું લોકેશન જુઓ. ખાલી દોડવાનું બંધ કરો અને દલાલો વગર કંપનીઓ પાસેથી સીધું કામ મેળવો.',
        card_fleet_b1: 'દરેક ગાડીનું લાઈવ લોકેશન અને સ્થિતિ',
        card_fleet_b2: 'ડીઝલ અને ટોલ ખર્ચનો આપોઆપ હિસાબ',
        card_fleet_b3: 'ભારતની ટોચની કંપનીઓ પાસેથી સીધું પાકું કામ',
        card_fleet_b4: 'ગાડી બગડતાં પહેલાં મેઇન્ટેનન્સની ચેતવણી',
        btn_register_fleet: 'તમારી ફ્લીટ નોંધાવો',

        // How it Works
        hiw_badge: '3 સરળ પગલાં',
        hiw_title: 'TruckNet કેવી રીતે કામ કરે છે',
        hiw_sub: 'ટ્રક બુક કરવી અને માલ મોકલવો હવે પહેલાં કરતાં વધુ સરળ, પારદર્શક અને સુરક્ષિત છે.',
        hiw_step1_title: '1 મિનિટમાં તમારા લોડની વિગતો ભરો',
        hiw_step1_sub: 'ઝડપી અને સ્પષ્ટ',
        hiw_step1_desc: 'ક્યાંથી માલ ભરવો અને ક્યાં પહોંચાડવો તે નાખો. તમને તુરંત જ સાચો અને ચોક્કસ ભાવ મળશે.',
        hiw_step1_hl: 'ત્વરિત સાચો ભાવ — કોઈ છૂપી ફી નહીં',

        hiw_step2_title: 'ચકાસાયેલ ટ્રક અને ડ્રાઈવર મેળવો',
        hiw_step2_sub: 'સરકારી કાગળો ચકાસાયેલ',
        hiw_step2_desc: 'નજીકનો વિશ્વસનીય ડ્રાઇવર તમારી ફેરી સ્વીકારે છે. ડ્રાઇવરનો નંબર અને વાહનની વિગતો તુરંત મળે છે.',
        hiw_step2_hl: 'ગાડી આરસી અને ડ્રાઈવરની 100% ચકાસણી',

        hiw_step3_title: 'લાઈવ જીપીએસ જુઓ અને પહોંચવા પર ચુકવણી કરો',
        hiw_step3_sub: 'સુરક્ષિત અને પાકું',
        hiw_step3_desc: 'નકશા પર ગાડીને લાઈવ ચાલતી જુઓ. જ્યારે માલ સહીસલામત પહોંચી જાય ત્યારે ઓટીપી આપીને સુરક્ષિત પેમેન્ટ કરો.',
        hiw_step3_hl: 'માલ સુરક્ષિત પહોંચ્યા પછી જ સુરક્ષિત પેમેન્ટ',
        hiw_cta_bar: 'દરેક ફેરી માટે ચકાસાયેલ દસ્તાવેજો, લાઈવ જીપીએસ અને 24/7 ફોન સહાય ઉપલબ્ધ.',

        // Live Demo
        demo_badge: 'પ્લેટફોર્મનો સરળ ડેમો',
        demo_title: 'જુઓ કે બુક અને ટ્રેક કરવું કેટલું સરળ છે',
        demo_sub: 'સરળ બુકિંગ પદ્ધતિ, હાઇવે પર બચત અને ડ્રાઇવરો માટે અવાજથી મદદની સુવિધાનો અનુભવ કરો.',
        demo_tab1: 'સરળ ટ્રક બુકિંગ',
        demo_tab2: 'રૂટ અને બચત',
        demo_tab3: 'ડ્રાઈવર સાથી (ગુજરાતી/હિન્દી)',

        // Trust
        trust_badge: 'સુરક્ષા, વિશ્વાસ અને મનની શાંતિ',
        trust_title: 'દરેક ફેરીમાં સુરક્ષાની 100% ખાતરી',
        trust_sub: 'અમે પરિવહનની ચિંતા દૂર કરીએ છીએ. તમારો માલ વેરિફાઇડ ડ્રાઇવરો, લાઈવ ટ્રેકિંગ અને સુરક્ષિત પેમેન્ટથી સુરક્ષિત રહે છે.',
        trust_p1_title: '100% સરકારી ચકાસાયેલ વાહનો',
        trust_p1_desc: 'દરેક વાહનની આરસી, ફિટનેસ, વીમો અને ડ્રાઇવરનું લાયસન્સ સરકારી રેકોર્ડમાંથી ચકાસાય છે.',
        trust_p2_title: 'સુરક્ષિત પેમેન્ટ ગેરંટી',
        trust_p2_desc: 'તમારા પૈસા સુરક્ષિત રહે છે અને માલ સહીસલામત પહોંચ્યાની ખાતરી થયા પછી જ ચૂકવાય છે.',
        trust_p3_title: 'આખા ભારતમાં 24/7 લાઈવ ગ્રાહક સહાય',
        trust_p3_desc: 'અમારી ટીમ દિવસ-રાત હાઇવે પર તમારી મદદ માટે ફોન પર હાજર રહે છે.',
        trust_p4_title: 'મુશ્કેલી વગર જીએસટી અને ટોલ પાસ',
        trust_p4_desc: 'ફાસ્ટેગ અને ઈ-વે બિલ ડિજિટલ હોવાથી ગાડી કોઈપણ બોર્ડર કે ટોલ પર અટકાતી નથી.',

        // Final CTA
        cta_badge: '1 મિનિટમાં શરૂ કરો',
        cta_title: 'શું તમે ઝડપથી માલ મોકલવા અને પૈસા બચાવવા માટે તૈયાર છો?',
        cta_sub: 'ભારતના હજારો વેપારીઓ, ટ્રાન્સપોર્ટર્સ અને ડ્રાઇવરો આજે જ TruckNet સાથે જોડાઈને ચિંતામુક્ત કામ કરી રહ્યા છે.',
        cta_btn_book: 'મફત ટ્રક બુક કરો',
        cta_btn_track: 'ગાડી ટ્રેક કરો અથવા લોડ શોધો',
        cta_b1: '100% ચકાસાયેલ ટ્રક અને ડ્રાઈવર',
        cta_b2: 'દલાલોનું કોઈ કમિશન નહીં',
        cta_b3: 'માલ પહોંચવા પર જ સુરક્ષિત ચુકવણી',

        // Footer
        footer_status: '24/7 સક્રિય ટ્રાન્સપોર્ટ સેવા',
        footer_coverage: 'ભારતના તમામ 28 રાજ્યોમાં સેવા',
        footer_helpline: 'હેલ્પલાઇન નંબર: 1800-TRUCKNET',
        footer_support_sub: 'ત્વરિત ફોન સહાય ઉપલબ્ધ',
        footer_desc: 'ભારતનું સૌથી સરળ અને વિશ્વસનીય ટ્રક બુકિંગ પ્લેટફોર્મ. સાચા ભાવ, લાઈવ ટ્રેકિંગ અને સમયસર ડિલિવરીની સંપૂર્ણ ખાતરી.',
        footer_verified: '100% સરકારી ચકાસાયેલ વ્યાવસાયિક ટ્રક',
        footer_made_with: 'ભારતીય ટ્રાન્સપોર્ટર્સ અને ટ્રક ડ્રાઇવરોના સમ્માનમાં સમર્પિત 🇮🇳 🚛',
    },
};

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
    currentLanguageLabel: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('en');

    useEffect(() => {
        const saved = localStorage.getItem('trucknet_lang') as LanguageCode;
        if (saved && TRANSLATIONS[saved]) {
            setLanguageState(saved);
        }
    }, []);

    const setLanguage = (lang: LanguageCode) => {
        setLanguageState(lang);
        localStorage.setItem('trucknet_lang', lang);
    };

    const t = (key: string): string => {
        const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
        return langDict[key] || TRANSLATIONS.en[key] || key;
    };

    const currentOption = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
                currentLanguageLabel: currentOption.nativeLabel,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
