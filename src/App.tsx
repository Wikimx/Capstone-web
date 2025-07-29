import React, {useEffect, useRef, useState} from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import emailjs from 'emailjs-com';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [builtSubPage, setBuiltSubPage] = useState('main');
  const [validationSubPage, setValidationSubPage] = useState('main');
  const [analysisSubPage, setAnalysisSubPage] = useState('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pages = [
    { id: 'problem', title: 'The Problem and Why It Matters?' },
    { id: 'proposal', title: 'The Proposal' },
    { id: 'built', title: 'How It Was Built?' },
    { id: 'demo', title: 'The Demo' },
    { id: 'validation', title: 'Results & Validation' },
    { id: 'analysis', title: 'Analysis & Insights' },
    { id: 'limitations', title: 'Limitations & Ethical Considerations' },
    { id: 'conclusions', title: 'Overall Conclusions' },
    { id: 'researcher', title: 'About the Researcher' },
    { id: 'references', title: 'References' }
  ];

  const getCurrentPageIndex = () => {
    return pages.findIndex(page => page.id === currentPage);
  };

  const getNextPage = () => {
    const currentIndex = getCurrentPageIndex();
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      return pages[currentIndex + 1];
    }
    return null;
  };

  const getPreviousPage = () => {
    const currentIndex = getCurrentPageIndex();
    if (currentIndex > 0 && currentIndex < pages.length) {
      return pages[currentIndex - 1];
    }
    return null;
  }

  interface CollapsibleSectionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }

  const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen && contentRef.current) {
        // Set the height to auto initially to get the full height
        setContentHeight(contentRef.current.scrollHeight);

        // Set up a MutationObserver to watch for changes in the content
        const observer = new MutationObserver(() => {
          // When content changes, update the height
          if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
          }
        });

        // Start observing the content for changes
        observer.observe(contentRef.current, {
          childList: true,      // Watch for changes to child elements
          subtree: true,        // Watch all descendants, not just direct children
          characterData: true,  // Watch for changes to text content
          attributes: true      // Watch for changes to attributes
        });

        // Clean up the observer when component unmounts or dependencies change
        return () => {
          observer.disconnect();
        };
      } else {
        setContentHeight(0);
      }
    }, [isOpen, children]); // Re-measure when children change (e.g., when response is loaded)

    return (
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-[#95B1EE] overflow-hidden transition-all duration-300 hover:shadow-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-8 py-6 flex items-center justify-between text-left transition-all duration-300 hover:bg-[#FFFDF5]"
        >
          <h3 className="text-xl font-bold text-[#2B3A6B]">{title}</h3>
          <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={24} className="text-[#ECE9DF]" />
          </div>
        </button>
        <div 
          className="transition-all duration-500 ease-in-out overflow-hidden"
          style={{ maxHeight: `${contentHeight}px`, opacity: isOpen ? 1 : 0 }}
        >
          <div className="px-8 pb-8" ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  interface ContentPlaceholderProps {
    height?: string;
    text?: React.ReactNode;
  }

  const ContentPlaceholder: React.FC<ContentPlaceholderProps> = ({ height = "h-auto", text }) => {
    const [question, setQuestion] = React.useState<string>("");
    const [profile, setProfile] = React.useState<string>("");
    const [response, setResponse] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [submitted, setSubmitted] = React.useState<boolean>(false);
    const [contentKey, setContentKey] = React.useState<number>(0); // Used to force re-render

    const profiles = [
      { id: "cdmx_c-d+_18-25", name: "CDMX Working-class youth (C-D+, 18–25)" },
      { id: "mty_c+b_35-55", name: "Monterrey Middle-class adults (C+B, 35–55)" }
    ];

    // Update the content key when response changes to trigger parent recalculation
    useEffect(() => {
      if (response) {
        // Small delay to ensure the DOM has updated with the new content
        const timer = setTimeout(() => {
          setContentKey(prevKey => prevKey + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [response]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!question.trim()) {
        setError("Please enter a question");
        return;
      }

      if (!profile) {
        setError("Please select a profile");
        return;
      }

      setError(null);
      setLoading(true);
      setSubmitted(true);

      try {
        // Make API call
        const response = await fetch("https://a7a1bbaf0574.ngrok-free.app/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            profile,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        // Extract content after the last "### Respuesta:" marker
        const fullResponse = data.response;
        const lastResponderIndex = fullResponse.lastIndexOf("### Respuesta:");

        if (lastResponderIndex !== -1) {
          // Get content after the last "### Respuesta:" marker
          const extractedContent = fullResponse.substring(lastResponderIndex + "### Respuesta:".length).trim();
          setResponse(extractedContent);
        } else {
          // If marker not found, use the full response
          setResponse(fullResponse);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    const handleReset = () => {
      setQuestion("");
      setProfile("");
      setResponse("");
      setError(null);
      setSubmitted(false);
    };

    return (
      <div 
        key={contentKey} // Use contentKey to force re-render when response changes
        className={`${height} border-2 border-dashed border-[#95B1EE] rounded-lg bg-[#FFFDF5] transition-all duration-300 hover:border-[#ECE9DF] p-6`}
      >
        {text && <p className="text-[#4A4A4A] text-center px-4 mb-6">{text}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-[#2B3A6B] mb-2">
              Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here"
              className="w-full px-4 py-2 border border-[#95B1EE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="profile" className="block text-sm font-medium text-[#2B3A6B] mb-2">
              Profile
            </label>
            <select
              id="profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="w-full px-4 py-2 border border-[#95B1EE] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a profile</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#2B3A6B] text-[#ECE9DF] rounded-lg font-medium transition-all duration-300 hover:bg-[#ECE9DF] hover:text-[#2B3A6B] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2B3A6B] disabled:hover:text-[#ECE9DF] disabled:hover:scale-100"
            >
              {loading ? "Generating..." : "Generate Response"}
            </button>

            {submitted && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 bg-[#ECE9DF] text-[#2B3A6B] rounded-lg font-medium transition-all duration-300 hover:bg-[#2B3A6B] hover:text-[#ECE9DF] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B3A6B]"></div>
          </div>
        )}

        {response && !loading && (
          <div className="mt-6 p-6 bg-white border border-[#95B1EE] rounded-md break-words">
            <h3 className="text-lg font-medium text-[#2B3A6B] mb-2">Response:</h3>
            <p className="text-[#4A4A4A] whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    );
  };



  const NavigationButtons = () => {
    const previousPage = getPreviousPage();
    const nextPage = getNextPage();

    return (
      <div className="flex justify-between mt-12">
        {previousPage && (
          <button
            onClick={() => {
              setCurrentPage(previousPage.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center px-6 py-3 bg-[#2B3A6B] text-[#ECE9DF] rounded-lg font-medium transition-all duration-300 hover:bg-[#ECE9DF] hover:text-[#2B3A6B] hover:scale-105"
          >
            <ArrowRight size={20} className="transform rotate-180 transition-transform group-hover:-translate-x-1 mr-2" />
            <span className="ml-2">{previousPage.title}</span>
          </button>
        )}
        {!previousPage && <div></div>} {/* Spacer when no previous button */}
        {nextPage && (
          <button
            onClick={() => {
              setCurrentPage(nextPage.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center px-6 py-3 bg-[#2B3A6B] text-[#ECE9DF] rounded-lg font-medium transition-all duration-300 hover:bg-[#ECE9DF] hover:text-[#2B3A6B] hover:scale-105"
          >
            <span className="mr-2">{nextPage.title}</span>
            <ArrowRight size={20} className="transform transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    );
  };

  const renderHomePage = () => (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative bg-[#2B3A6B] text-[#ECE9DF] rounded-3xl p-12 mb-16 overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-[#ECE9DF]">
            Rethinking how we listen to population segments
          </h1>
          <p className="text-2xl mb-10 text-[#E7F1A8] max-w-2xl mx-auto leading-relaxed font-serif italic">
            Real people. Real data. Simulated voices.
          </p>
          <div className="text-base mb-10 text-[#ECE9DF] max-w-3xl mx-auto leading-relaxed space-y-4 text-justify">
            <p>
              This project explores how large language models, trained with real qualitative data, can simulate the voice of the people from different regions and social groups in Mexico.
            </p>
            <p>
              By combining anthropology, political communication, and AI, we aim to prototype new ways of listening. Not as a replacement for traditional research, but as a tool to expand its reach in urgent, high-stakes contexts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('problem')}
              className="group inline-flex items-center px-8 py-4 bg-[#ECE9DF] text-[#2B3A6B] font-semibold rounded-full transition-all duration-300 hover:bg-[#D4CFC0] hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Learn More
              <ArrowRight size={20} className="ml-2 transform transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setCurrentPage('demo')}
              className="group inline-flex items-center px-8 py-4 bg-[#ECE9DF] text-[#2B3A6B] font-semibold rounded-full transition-all duration-300 hover:bg-[#D4CFC0] hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Demo
              <ArrowRight size={20} className="ml-2 transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProblemPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">The Problem and Why It Matters?</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
          <p>
            In contemporary democracies, a <strong>growing disconnection between political elites and ordinary citizens</strong> is reshaping public life. Nowhere is this fracture more evident than in Mexico, where <strong>institutional trust is low</strong> and <strong>political discourse often feels detached from the everyday concerns of voters</strong>. While tools like polls and focus groups remain important, they are often <strong>too slow, too costly, or too limited</strong> to inform fast-moving political contexts. More crucially, they tend to <strong>prioritize measurement over meaning</strong>.
          </p>

          <p>
            Many citizens <strong>no longer see themselves reflected in public debates</strong>. They are spoken about, but <strong>rarely listened to</strong>. Political campaigns often rely on <strong>demographic stereotypes</strong> or <strong>simplified messaging strategies</strong>, failing to engage with how people actually think and talk. This is <strong>not just a political crisis. It is a communicative one</strong>.
          </p>

          <p>
            In the language of Rittel and Webber (1973), this constitutes a <strong>wicked problem</strong>: one that <strong>resists linear solutions</strong> and evolves with the tools used to address it. In such contexts, <strong>knowledge production must be not only technically sound but also ethically reflexive</strong>. Yet most of the methodologies used in public opinion research <strong>fall short</strong>. <strong>Surveys scale easily but miss nuance</strong>. <strong>Focus groups capture depth</strong>, but are <strong>labor-intensive, time-bound</strong>, and often <strong>disregarded once the fieldwork is over</strong>.
          </p>

                      <img 
              src="/TPAWIM01.png" 
              alt="Problem visualization" 
              className="w-full h-auto rounded-lg"
            />

          <p>
            One last point is rarely acknowledged: many qualitative agencies accumulate <strong>hundreds of transcripts</strong>, rich in <strong>discourse, emotion, and contradiction</strong>, only to archive them in folders that are <strong>never computationally processed or revisited</strong>. This creates a <strong>massive underused resource</strong> and a <strong>lost opportunity</strong> for <strong>deeper, iterative listening</strong>.
          </p>

          <p>
            At the same time, <strong>recent advances in generative AI</strong> have made it possible to <strong>simulate human discourse at scale</strong>. But the promise of these tools has so far been mostly explored with <strong>synthetic prompts or structured survey data</strong>, often <strong>flattening identity into static variables</strong>. Few if any have attempted to <strong>ground these simulations in real qualitative material</strong>, or to <strong>model discourse as something socially situated and affectively charged</strong>.
          </p>

          <p>
            This project seeks to <strong>bridge that gap</strong>. What if we could use large language models <strong>not just to generate plausible responses</strong>, but to <strong>simulate the discursive styles of specific population segments</strong> using <strong>real data from focus groups</strong>? What if we could move beyond <strong>demographic placeholders</strong> and train models that speak with the <strong>tone, contradictions, and emotional registers of actual voters</strong>?
          </p>

          <p>
            This is <strong>not simply a technical challenge</strong>. It is an <strong>epistemological and political one</strong>. Simulating voter discourse raises important concerns around <strong>bias, representation, and misuse</strong>. But in moments of <strong>urgency such as elections, crises, or civic unrest</strong>, the ability to <strong>listen faster without flattening meaning</strong> could be <strong>transformative</strong>. <strong>Not to replace human research, but to extend its reach</strong>.
          </p>

          <p>
            This matters because the <strong>health of a democracy</strong> depends not only on <strong>what is said</strong>, but on <strong>who gets heard and how</strong>. If we can use AI <strong>not to overwrite the public voice but to amplify it</strong>, this project may offer a <strong>new way to build that bridge</strong> between <strong>political systems and the citizens they serve</strong>.
          </p>
        </div>
      </div>

      <NavigationButtons />
    </div>
  );

  const renderProposalPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">The Proposal</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
          <p>
            This project explores whether a <strong>chatbot, trained</strong> not on synthetic personas or survey summaries, but <strong>on actual conversations between real persons,</strong> can simulate politically situated discourse with emotional nuance and demographic specificity.
          </p>

          <p>
            Rather than asking a generic model to "sound like a young person" or "respond like a conservative voter," this experiment <strong>uses transcripts from over 300 focus groups</strong> conducted in Mexico between 2023 and 2025. Each session was designed to capture real political reasoning across <strong>region, class, and age</strong>. This qualitative data is then structured and used to fine-tune a language model that later uses <strong>RAG technique</strong> to answer questions.
          </p>

          <p>
            The decision to apply <strong>fine-tuning</strong> was driven by the need to capture tone, lexical choices, and discursive style characteristic of each segment. In parallel, <strong>RAG</strong> was implemented to provide the model with <strong>factual grounding</strong> and <strong>richer contextual explanations</strong>, enhancing the reasoning and semantic coherence of its outputs. Each component addressed different aspects of political voice: fine-tuning helped simulate <strong>how people speak</strong>, while RAG helped explain <strong>why they speak that way</strong>.
          </p>

          <p>
            The result is not a universal chatbot. It is a <strong>set of segment-specific agents</strong> trained to simulate how different types of voters speak, think, and feel when discussing politics.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">How is this different from existing approaches?</h2>
        <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
          <p>
            Several recent projects have explored the simulation of human behavior using large language models. <strong>PersonaBot by Ipsos</strong>, for example, combines survey data and AI to model consumer segments, but offers no public insight into its <strong>data sources</strong>, <strong>validation metrics</strong>, or <strong>applicability to political contexts</strong>.
          </p>

          <p>
            Academic work by Argyle et al. (2022) has shown that LLMs can simulate demographic groups based on survey traits, while Park et al. (2024) demonstrated how life-history interviews can inform rich agent simulations. However, most of these efforts rely on <strong>static prompts</strong> or <strong>survey-derived profiles</strong>. They tend to treat identity as a <strong>fixed input</strong> rather than an <strong>emergent, discursive process</strong>.
          </p>

          <img 
            src="/OP01.png" 
            alt="Methodology comparison" 
            className="w-full h-auto rounded-lg"
          />

          <p>
            <strong>This project takes a different path.</strong> It builds directly on the <strong>dialogic structure of focus groups</strong>, aiming to preserve <strong>contradiction, affect, and hesitation</strong>. It does not reduce political speech to opinion points. It treats it as a <strong>form of social storytelling</strong>. By combining <strong>fine-tuning</strong>, <strong>retrieval augmentation</strong>, and <strong>qualitative data</strong>, this prototype explores whether large language models can echo the voices of those who are often talked about, but rarely listened to.
          </p>
        </div>
      </div>

      <NavigationButtons />
    </div>
  );

  const renderBuiltPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">How It Was Built?</h1>
      </div>

      {builtSubPage === 'main' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
              <p>
                This project sits at the intersection of <strong>qualitative inquiry</strong> and <strong>computational modeling</strong>. Rather than discarding the interpretive richness of focus group research in favor of speed or scale, it seeks to <strong>operationalize that richness through a hybrid pipeline</strong>. Every stage, from <strong>data curation to modeling</strong>, was designed to preserve the complexity of real political discourse while enabling systematic simulation.
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <button
              onClick={() => {
                setBuiltSubPage('data-collection');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">1. Qualitative Data Collection and Curation</h3>
            </button>

            <button
              onClick={() => {
                setBuiltSubPage('nlp-structuring');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">2. NLP-Based Structuring and Quantification</h3>
            </button>

            <button
              onClick={() => {
                setBuiltSubPage('language-modeling');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">3. Language-Based Modeling</h3>
            </button>

            <button
              onClick={() => {
                setBuiltSubPage('prompt-structure');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Prompt Structure and Generation Parameters</h3>
            </button>
          </div>
        </>
      )}

      {builtSubPage === 'data-collection' && (
        <>
          <button
            onClick={() => {
              setBuiltSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to How It Was Built?
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">1. Qualitative Data Collection and Curation</h2>
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
              <p>
                The prototype is built on a <strong>corpus of over 250 focus group transcripts</strong> collected in Mexico between 2023 and 2025 by <strong>CAPTA</strong>, the qualitative research agency I lead. Although these sessions were not originally conducted for a single project, they share a common concern: <strong>understanding public opinion in contexts of institutional distrust and political polarization</strong>.
              </p>
              <p>
                Participants were recruited using <strong>snowball sampling</strong> and screened according to <strong>AMAI segment rules</strong>. Within each group, we ensured <strong>variation in age and gender</strong>, and excluded <strong>repeat participants</strong>. Sessions were led by <strong>senior moderators</strong> trained in <strong>semi-structured and emergent techniques</strong> to ensure rich, reflective dialogue.
              </p>
              <p>
                We selected two segments for simulation: <strong>working-class youth from CDMX (C-D+, 18–25)</strong> and <strong>middle-class professionals from Monterrey (C+B, 35–55)</strong>. These were chosen due to their <strong>distinct political profiles</strong> and <strong>data availability</strong>. The first segment tended to support <strong>redistributive policies</strong> and expressed identification with <strong>President López Obrador</strong>. The second emphasized <strong>meritocracy</strong> and <strong>skepticism toward populist narratives</strong>.
              </p>
              <p>
                Importantly, <strong>no segment was homogeneous</strong>. While patterns emerged, <strong>disagreement and tension were common</strong>. Rather than filter these out, moderators encouraged <strong>debate</strong>, making the corpus a <strong>dialogic space</strong> where ideas were contested and negotiated.
              </p>
              <p>
                The challenge and opportunity of using this corpus to fine-tune a generative model lies <strong>precisely in this tension</strong>. The goal is not to simulate what people think in the aggregate, but to approximate <strong>how they speak, how they reason, hesitate, identify, or contradict themselves</strong>. In a political environment saturated with <strong>polling averages</strong> and <strong>demographic abstractions</strong>, capturing the <strong>discursive lifeworld</strong> of different segments is not just methodologically novel. It may be <strong>epistemologically necessary</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setBuiltSubPage('nlp-structuring');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">2. NLP-Based Structuring and Quantification</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {builtSubPage === 'nlp-structuring' && (
        <>
          <button
            onClick={() => {
              setBuiltSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to How It Was Built?
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">2. NLP-Based Structuring and Quantification</h2>
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
              <p>
                Once curated, the transcripts were transformed through a structured pipeline to enable <strong>fine-tuning</strong> and <strong>retrieval-augmented generation (RAG)</strong>. This phase marked the beginning of applying the <strong>technical knowledge</strong> I developed at <strong>LIS</strong>, having arrived without prior coding experience. Through <strong>Python in Colab</strong>, I used <strong>for-loops</strong> to convert .txt transcripts into structured .csv files, and gradually adopted <strong>data science tools like Pandas</strong> to organize and manipulate the data.
              </p>
              <p>
                This seemingly simple transformation from <strong>unstructured transcripts to structured databases</strong> was not only a key step in this project, but one I was able to <strong>replicate and implement in real-world research projects</strong> conducted at <strong>CAPTA</strong>, my own agency, during my time in the master's programme.
              </p>
              <p>
                For the <strong>fine-tuning</strong> training we began by <strong>filtering out all moderator interventions</strong>, retaining only those labeled with the role <strong>"Participant"</strong>. While this decision limits the dialogic context of the conversation, it also <strong>minimizes the risk</strong> of the model learning prompts or expectations shaped by the facilitator.
              </p>
              <p>
                Rather than cleaning or standardizing the transcripts for neutrality, <strong>stylistic elements were deliberately preserved</strong>. This included <strong>fillers, rhetorical devices, colloquialisms, and even emotional outbursts</strong>. No attempt was made to sanitize informal speech, as the core aim was to <strong>maintain the affective and argumentative quality</strong> of voter discourse.
              </p>
              <p>
                For <strong>RAG</strong>, and in order to make the search more efficient, I created blocks of interventions called <strong>"rack_id"</strong>. To structure coherent blocks of conversation, each unit was required to <strong>start with a moderator intervention</strong>, and subsequent moderator interventions were included to maintain coherence. <strong>Topics raised by moderators were also coded to all rack_id</strong>.
              </p>
              <p>
                <strong>Careful attention was paid to token count.</strong> Each conversational block was designed to fall between a <strong>minimum of 450 tokens</strong> and a <strong>maximum of 1200</strong>, aligned with the constraints of the Salamandra 7B model. This range was selected to ensure <strong>argumentative coherence</strong> while staying within processing limits. In the context of RAG, it also ensured that <strong>retrieved blocks contained sufficient discursive context</strong> for the model to "know what is being talked about." Blocks were formatted in an <strong>Alpaca-style instruction template</strong> to make the training data compatible with standard instruction-tuned language models.
              </p>
              <p>
                The corpus was <strong>embedded using the Qwen3-Embedding-4B model</strong>, with embeddings obtained via mean pooling over token representations. This model was selected for its <strong>strong semantic encoding capabilities</strong> and <strong>compatibility with long, informal, and affective texts</strong> like focus group transcripts. Its performance in <strong>capturing nuanced discursive content</strong> made it particularly well-suited for this project.
              </p>
              <p>
                <strong>Embeddings are numerical vectors that encode semantic meaning</strong>, enabling retrieval of contextually similar passages beyond simple keyword matching. These were <strong>indexed using FAISS</strong> with <strong>L2 (Euclidean) distance</strong>. FAISS was chosen for its <strong>speed and scalability</strong>, enabling <strong>real-time similarity search</strong> over thousands of blocks without sacrificing retrieval quality. A mapping between <strong>rack_id and vector index</strong> was stored to enable <strong>traceable retrieval</strong> during generation. <strong>No separate reranking step</strong> was applied; results were ordered based on <strong>direct FAISS nearest neighbor search</strong>.
              </p>
              <p>
                This pipeline balances <strong>qualitative nuance</strong> with <strong>computational precision</strong>, treating discourse as <strong>layered, relational evidence</strong>. It enables the model to <strong>simulate political reasoning without flattening its complexity</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setBuiltSubPage('language-modeling');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">3. Language-Based Modeling</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {builtSubPage === 'language-modeling' && (
        <>
          <button
            onClick={() => {
              setBuiltSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to How It Was Built?
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">3. Language-Based Modeling</h2>
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
              <p>
                To simulate political discourse in a segment-specific and realistic way, this phase applied <strong>fine-tuning using QLoRA</strong> on the <strong>Salamandra‑7B‑instruct model</strong>. Salamandra was selected not only for its compatibility with open-source infrastructure, but because of its <strong>high proportion of Latin American Spanish</strong> in pretraining. This was crucial for retaining idiomatic expressions, tonal nuance, and culturally specific references present in the transcripts. The 7B version also allowed full training within the limits of a <strong>single A100 GPU on Google Colab Pro</strong>.
              </p>
              <p>
                Fine-tuning was essential not only to replicate vocabulary, but to simulate the <strong>emotional and discursive register</strong> unique to each group. It enabled the model to internalize variation in tone, formality, and argumentative rhythm, aligning outputs with the expressive range of the source material.
              </p>
              <p>
                As introduced earlier, <strong>two separate models</strong> were trained: one for <strong>CDMX_C-D+_18–25</strong> and another for <strong>MTY_C+B_35–55</strong>. This prevented cross-contamination of vocabulary, affect, and narrative structure. Rather than aiming for a universal chatbot, the goal was to simulate how different types of voters think, feel, and speak in political conversation.
              </p>
              <p>
                To complement stylistic fidelity with factual grounding, <strong>Retrieval-Augmented Generation (RAG)</strong> was implemented. For each prompt, the system retrieved relevant conversation blocks from the embedded corpus and constructed a <strong>context-aware prompt</strong> before generation. This hybrid approach ensured that responses were not only voiced with segment-specific texture, but also grounded in concrete, thematically relevant material.
              </p>
              <p>
                Having fine-tuned the model and implemented RAG for contextual grounding, the next step was to define how questions would be posed and how responses would be generated. This involved specifying the <strong>structure of the prompts</strong> and calibrating <strong>generation parameters</strong> to maximize realism, coherence, and variation across simulated outputs.
              </p>
              
              {/* Visual representation of the modeling approach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                  <img 
                    src="/Fine%20Tuning.png" 
                    alt="Fine Tuning Process Visualization" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                  <img 
                    src="/RAG.png" 
                    alt="RAG (Retrieval-Augmented Generation) Process Visualization" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setBuiltSubPage('prompt-structure');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Prompt Structure and Generation Parameters</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {builtSubPage === 'prompt-structure' && (
        <>
          <button
            onClick={() => {
              setBuiltSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to How It Was Built?
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Prompt Structure and Generation Parameters</h2>
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
              <p>
                To ensure consistent and realistic simulation of participant discourse, all questions were processed using a <strong>standardized prompt structure</strong> based on <strong>retrieval-augmented generation (RAG)</strong>. Each prompt included <strong>real excerpts from focus groups</strong>, retrieved using <strong>FAISS</strong> and <strong>re-ranked via a cross-encoder</strong>, followed by a <strong>tailored instruction</strong> and the target question. The prompt followed this structure:
              </p>
              <div className="bg-[#FFFDF5] border border-[#95B1EE] rounded-lg p-4 my-4 font-mono text-sm">
                <p><strong>Instruction:</strong> Based on the following fragments of real conversations: {`{context}`} Answer the following question with a <strong>realistic, informal tone</strong> similar to the style of the texts shown above, but <strong>clear, avoid introductions</strong>. {`{question}`}</p>
              </div>
              <p>
                <strong>Final generation parameters:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Number of retrieved blocks:</strong> 4</li>
                <li><strong>Max tokens per response:</strong> 180 to 200</li>
                <li><strong>Temperature:</strong> 0.4</li>
                <li><strong>Top-p (nucleus sampling):</strong> 0.8</li>
              </ul>

              <p>
                <strong>Justification:</strong>
              </p>
              <p>
                The instruction was designed to guide the model toward <strong>natural and segment-appropriate speech</strong>. It emphasizes a <strong>realistic and informal tone</strong> to match the style of the retrieved focus group excerpts. The explicit phrase <strong>"but clear, avoid introductions"</strong> was added to prevent the model from producing <strong>formulaic or repetitive openings</strong>, encouraging it instead to simulate the <strong>direct and often emotionally charged</strong> way participants speak in real group settings.
              </p>
              <p>
                As for the generation parameters:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Number of retrieved blocks: 4</strong> - This number was chosen to balance contextual richness with computational constraints. It provides sufficient variation in discourse while keeping the overall prompt length within the model's context window. For Salamandra-7B-instruct, the total context window (input + output) is approximately 4,096 tokens.</li>
                <li><strong>Max tokens per response: 180 to 200</strong> - This range allows for elaborated, coherent answers that resemble real focus group interventions. It accommodates informal reasoning, emotional nuance, and anecdotal content without becoming excessively verbose.</li>
                <li><strong>Temperature: 0.4</strong> - A lower temperature was used to reduce randomness in the output, ensuring responses remain grounded, consistent, and reflective of the stylistic and rhetorical norms of the training data.</li>
                <li><strong>Top-p: 0.8</strong> - Limiting sampling to the top 80% of the probability mass helps generate text that is both plausible and slightly varied, without drifting into generic or irrelevant phrasing.</li>
              </ul>
              <p>
                Together, these decisions were made to maximize <strong>stylistic fidelity</strong>, <strong>discursive realism</strong>, and <strong>segment-specific coherence</strong>, enabling the model to approximate not just what participants say, but how they say it.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <button
              onClick={() => {
                setCurrentPage('demo');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group p-8 bg-[#ECE9DF] text-[#2B3A6B] rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span className="text-lg">Explore the Demo</span>
              <ArrowRight size={20} className="ml-2 inline transform transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => {
                setCurrentPage('validation');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group p-8 bg-[#ECE9DF] text-[#2B3A6B] rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
                              <span className="text-lg">View Results & Validation</span>
              <ArrowRight size={20} className="ml-2 inline transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </>
      )}

      <NavigationButtons />
    </div>
  );

  const [demoFormData, setDemoFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    message: ''
  });
  const [demoFormStatus, setDemoFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [demoFormMessage, setDemoFormMessage] = useState('');

  const handleDemoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormStatus('loading');
    setDemoFormMessage('');

    try {
      // Initialize EmailJS with your credentials
      emailjs.init("la-h937LHBTaJ0do2");

      // Prepare the email template parameters
      const templateParams = {
        to_email: 'wikimx@gmail.com, j.garcialunaperez@lis.ac.uk, joaquin@captaestudios.com',
        preferred_date: demoFormData.preferredDate,
        preferred_time: demoFormData.preferredTime,
        additional_message: demoFormData.message || 'No additional message provided',
        submitted_on: new Date().toLocaleString(),
        from_name: 'Anonymous User',
        from_email: 'anonymous@demo-request.com'
      };

      // Send email using EmailJS
      await emailjs.send(
        'service_1s7ypgs',
        'template_4on0p3n',
        templateParams
      );
      
      setDemoFormStatus('success');
      setDemoFormMessage('Request submitted successfully! Your anonymous request has been sent.');
      
      // Reset form
      setDemoFormData({
        preferredDate: '',
        preferredTime: '',
        message: ''
      });

    } catch (error) {
      console.error('EmailJS Error:', error);
      setDemoFormStatus('error');
      setDemoFormMessage('Failed to submit request. Please try again.');
    }
  };

  const handleDemoFormChange = (field: string, value: string) => {
    setDemoFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderDemoPage = () => {

    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">The Demo</h1>
        </div>

      <CollapsibleSection title="Schedule Demo Access" defaultOpen={true}>
        <div className="space-y-6">
          <div className="text-[#4A4A4A] text-justify leading-relaxed">
            <p className="mb-4">
              To access the live demo, please send me an anonymous message with your preferred date and time. <strong>Requests must be submitted at least 48 hours in advance.</strong> The models are only active during scheduled windows due to resource limitations.
            </p>
          </div>
          
          <form onSubmit={handleDemoFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-[#2B3A6B] mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={demoFormData.preferredDate}
                onChange={(e) => handleDemoFormChange('preferredDate', e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#95B1EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-[#2B3A6B] mb-2">
                Preferred Time *
              </label>
              <input
                type="time"
                id="preferredTime"
                name="preferredTime"
                value={demoFormData.preferredTime}
                onChange={(e) => handleDemoFormChange('preferredTime', e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#95B1EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[#2B3A6B] mb-2">
                Additional Message (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={demoFormData.message}
                onChange={(e) => handleDemoFormChange('message', e.target.value)}
                rows={4}
                placeholder="Any additional information or questions..."
                className="w-full px-4 py-2 border border-[#95B1EE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:border-transparent resize-vertical"
              />
            </div>
            
            {demoFormMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                demoFormStatus === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {demoFormMessage}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={demoFormStatus === 'loading'}
                className="px-6 py-3 bg-[#2B3A6B] text-[#ECE9DF] font-semibold rounded-lg hover:bg-[#1E2A4A] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B3A6B] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoFormStatus === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoFormData({
                    preferredDate: '',
                    preferredTime: '',
                    message: ''
                  });
                  setDemoFormStatus('idle');
                  setDemoFormMessage('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear Form
              </button>
            </div>
          </form>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-[#2B3A6B] mb-2">Note:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This is an anonymous form - no personal information is collected</li>
              <li>Demo sessions typically last 15-30 minutes</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed space-y-6">
          <p>
            You are invited to try the <strong>live demo</strong> and interact directly with <strong>two simulated voter profiles</strong>. Ask any political question. Both models will respond side by side, in <strong>Spanish and English</strong>.
          </p>
          <p>
            No login is needed. However, please send me an anonymous message indicating the <strong>date and time</strong> you plan to access it, since the models are only active during <strong>scheduled windows</strong> due to <strong>resource limitations</strong>. Use the demo to explore how <strong>different segments sound</strong> when reacting to politics.
          </p>
        </div>
      </div>

      <CollapsibleSection title="Interactive Demo" defaultOpen={true}>
        <ContentPlaceholder height="h-auto" text="Interactive zone placeholder - Your demo will go here" />
      </CollapsibleSection>

      <CollapsibleSection title="Suggested Questions">
        <div className="space-y-4">
          {/*<ContentPlaceholder height="h-20" text="Suggested question 1 will be added here" />*/}
          {/*<ContentPlaceholder height="h-20" text="Suggested question 2 will be added here" />*/}
          {/*<ContentPlaceholder height="h-20" text="Suggested question 3 will be added here" />*/}
        </div>
      </CollapsibleSection>

      <NavigationButtons />
    </div>
  );
  };

  const renderValidationPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">Results & Validation</h1>
      </div>

      {validationSubPage === 'main' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <div className="prose max-w-none text-[#4A4A4A] text-justify leading-relaxed">
              <p>
                This section presents the validation methodology from testing the political discourse simulation system. The validation process was designed to assess both the technical performance and the qualitative authenticity of the generated responses across different demographic segments.
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <button
              onClick={() => {
                setValidationSubPage('internal-main');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results: Internal Validation</h3>
            </button>

            <button
              onClick={() => {
                setValidationSubPage('external-main');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results: External Validation</h3>
            </button>


          </div>
        </>
      )}

      {validationSubPage === 'internal-main' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Results & Validation
          </button>

          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Internal Validation: Comparing Generated and Dataset Responses</h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-justify leading-relaxed">
                To evaluate the model's fidelity to established human reasoning and its capacity to produce coherent discourse, we conducted an internal validation exercise anchored in a quantitative juxtaposition of synthesised and reference responses. <strong>The experimental design centred on four reference questions,</strong> comprising a pair already embedded in the training corpus and an equivalent novel pair. The approach thereby permitted an appraisal of both the assimilation of pre-existing discourse and the generation of contextually congruous replies to previously unencountered prompts.
              </p>

              <p className="text-justify leading-relaxed">
                The <strong>four benchmark questions</strong> were:
              </p>

              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li className="text-justify">What is your opinion of Claudia Sheinbaum as a presidential candidate?</li>
                <li className="text-justify">What are the main problems where you live?</li>
                <li className="text-justify">What do you think about the slogan "We do not live off handouts, we live off effort"?</li>
                <li className="text-justify">What do you think about the slogan "The people come first, not those at the top"?</li>
              </ol>

              <p className="text-justify leading-relaxed">
                Prompts <strong>one and two were directly available in the original corpus</strong> and were therefore used to juxtapose model-generated replies with dataset responses. Prompts <strong>three and four were newly authored to probe the model's capacity to produce segment-specific</strong> viewpoints that are not reducible to direct retrieval.
              </p>

              <p className="text-justify leading-relaxed">
                For each question, we generated <strong>20 responses per profile.</strong> In the case of the first two questions, we manually selected 20 dataset responses per profile from the corpus based on thematic relevance. No filtering was done by tone, vocabulary, or semantic quality.
              </p>

              <p className="text-justify leading-relaxed">
                The evaluation focused on three dimensions:
              </p>

              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Sentiment analysis</strong></li>
                <li><strong>Lexical similarity</strong></li>
                <li><strong>Semantic similarity</strong></li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          </div>

          <div className="space-y-6 mb-12">
            <button
              onClick={() => {
                setValidationSubPage('internal-sentiment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Sentiment Analysis</h3>
            </button>

            <button
              onClick={() => {
                setValidationSubPage('internal-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Lexical Similarity</h3>
            </button>

            <button
              onClick={() => {
                setValidationSubPage('internal-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Semantic Similarity</h3>
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'external-main' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Results & Validation
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Validation: Interviews with New Participants</h2>
            <div className="text-gray-700 space-y-4 leading-relaxed">
              <p className="text-justify">
                As a second layer of evaluation, eight semi-structured interviews with new participants were conducted. <strong>Each of the two segments (CDMX, C-D+, 18–25 and MTY, C+B, 35–55) was represented by four participants. The same four benchmark questions used in the internal validation were applied again to allow for direct comparison.</strong>
              </p>
              <p className="text-justify">
                For this validation, we used the same three quantitative metrics:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Sentiment analysis</strong></li>
                <li><strong>Lexical similarity</strong></li>
                <li><strong>Semantic similarity</strong></li>
              </ul>
              <p className="text-justify">
                <strong>Each metric was subject to different statistical tests as in the internal evaluation.</strong>
              </p>
              <p className="text-justify">
                In addition to the automated comparisons, a qualitative evaluation was carried out to assess the credibility of the model-generated responses. <strong>Each answer was rated on a scale from 1 to 10, based on how convincingly it resembled the real responses obtained during interviews with participants from the same demographic segment.</strong>
              </p>
              <p className="text-justify">
                This scoring was grounded primarily in a direct comparison between generated and real interview answers, but also drew on my professional experience conducting and analyzing over 2,000 political focus groups in Mexico. <strong>The evaluation criteria included tonal authenticity, vocabulary alignment, argumentative structure, and the degree to which each response reflected the social perspective and communicative style of the corresponding group.</strong>
              </p>
              <p className="text-justify">
                This layer of validation complements the computational metrics by addressing a different question: <strong>not whether the text is statistically similar, but whether it feels real and contextually plausible to someone familiar with how these voters actually speak and reason</strong>
              </p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <button
              onClick={() => {
                setValidationSubPage('external-sentiment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Sentiment Analysis</h3>
            </button>

            <button
              onClick={() => {
                setValidationSubPage('external-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Lexical Similarity</h3>
            </button>

            <button
              onClick={() => {
                setValidationSubPage('external-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Results - Semantic Similarity</h3>
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'internal-sentiment' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('internal-main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Internal Validation
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Results: Sentiment Analysis</h2>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-gray-700 space-y-4">
                <p className="text-justify leading-relaxed">
                  To gauge the emotional tone of the responses we applied sentiment analysis, revealing the affective undercurrents of the political discourse. Each utterance, originating from either the focus group dataset or the generated set, was evaluated with the pretrained classifier <strong>"cardiffnlp/twitter-roberta-base-sentiment,"</strong> a transformer model tailored for informal benchmarks and celebrated for its sensitivity to affect. The classifier yields a polarity score ranging from −1 for strong negativity to +1 for strong positivity, determined by lexical indicators, syntactic configurations, and recognized emotional sequences.
                </p>
                <p className="text-justify leading-relaxed">
                  This technique was applied to the two principal benchmark questions retained from the original focus group corpus. Within each voter segment, we calculated the <strong>mean sentiment</strong> of the dataset responses and contrasted them with the corresponding mean from the model-produced answers prompted by the same question. In addition to these mean values, we probed the <strong>entire distribution of sentiment scores</strong>, thereby illuminating variations in emotional tone that might have been concealed by average values alone.
                </p>
                <p className="text-justify leading-relaxed">
                  To evaluate statistically whether the model retained the affective profile of the original data, we employed a triad of complementary significance tests:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>t-test</strong>: Tested for differences in means assuming normal distribution.</li>
                  <li><strong>Wilcoxon signed-rank test</strong>: A non-parametric alternative that does not assume normality, appropriate given the small sample size and potential skew.</li>
                  <li><strong>Kolmogorov–Smirnov (KS) test</strong>: Compared the shape and spread of the two distributions to detect broader divergence in emotional patterns.</li>
                </ul>
                <p className="text-justify leading-relaxed">
                  Using multiple tests allowed for a robust evaluation under different statistical assumptions. This was critical because emotional tone in political discourse often varies not just in intensity, but in consistency and distribution across speakers. The goal was to determine whether <strong>the model replicated not only the general sentiment polarity, but the emotional diversity and balance typical of each segment's political expression.</strong>
                </p>
              </div>
            </div>
                   <div>
              <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">Profile</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Question</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Model Sent.</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Dataset Sent.</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">t-test p</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">t-test sig</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Wilcoxon p</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Wilcoxon sig</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">KS p</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">KS sig</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Corpus Sent.</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Corpus vs Model t-test p</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Corpus vs Model t-test sig</th>
                      <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Corpus vs Model KS p</th>
                      <th className="px-3 py-2 text-center font-semibold">Corpus vs Model KS sig</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                    <tr className="hover:bg-[#FFFDF5] transition-colors">
                      <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.118984</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.040012</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.000459</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.000105</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.00001</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.042</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FFFDF5] transition-colors">
                      <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.230552</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.110049</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.017109</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.008308</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.012299</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.042</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FFFDF5] transition-colors">
                      <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.11269</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.047824</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.009074</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.002712</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.012299</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.037</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FFFDF5] transition-colors">
                      <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.158286</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.10967</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.017353</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.017181</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.081058</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.037</td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                      <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0</td>
                      <td className="px-3 py-2 text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>


            </div>
            <div className="mt-8">
              <div className="space-y-8">
                {/* Primera fila: IntSent01 e IntSent02 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent01.png" 
                      alt="CDMX: Sentiment Distribution - Question 1" 
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent02.png" 
                      alt="CDMX: Sentiment Distribution - Question 2" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Segunda fila: IntSent03 e IntSent04 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent03.png" 
                      alt="MTY: Sentiment Distribution - Question 1" 
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent04.png" 
                      alt="MTY: Sentiment Distribution - Question 2" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                {/* Tercera fila: IntSent05 e IntSent06 */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent05.png" 
                      alt="CDMX: Sentiment Distribution - Corpus vs Generated" 
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/IntSent06.png" 
                      alt="Boxplot of Sentiment: Corpus vs Generated" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setValidationSubPage('internal-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Results - Lexical Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'internal-lexical' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('internal-sentiment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Sentiment Analysis
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Results: Lexical Similarity</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    Lexical similarity gauges the extent to which two corpora employ overlapping vocabulary. We quantified overlap with <strong>cosine similarity</strong>, a standard measure in computational linguistics that assesses the cosine of the angle between two term-frequency vectors embedded in a high-dimensional space. Each text was vectorized via <strong>CountVectorizer</strong>, producing integer-frequency matrices normalized by document length. The resulting cosine score ranges from 0 to 1; a score of 1 indicates perfect lexical overlap, while 0 signifies complete lexical independence.
                  </p>
                  <p>
                    For this evaluation, cosine similarity served to measure how closely the model-generated replies correspond to the responses found in the reference dataset, examined along two dimensions:
                  </p>
                  <p>
                    <strong>Model vs. Dataset Answers</strong>: For the two first benchmark questions extracted directly from the original corpus, cosine similarity was calculated between the generated answers and dataset responses from the corresponding focus group segment. A <strong>Mann–Whitney U test</strong> was applied to determine whether the distribution of these similarity scores differed significantly, indicating lexical divergence or alignment.
                  </p>
                  <p>
                    <strong>Model vs. Full Corpus</strong>: For all four questions (including experimental prompts not present in the original data), cosine similarity was also calculated against a broader corpus of responses from the same profile, regardless of the specific question. This comparison provided a more general sense of whether the model's vocabulary usage aligned with the lexical patterns typical of that demographic segment. Again, a <strong>Mann–Whitney U test</strong> was used to assess whether the distributions differed in a statistically significant way. By combining targeted and corpus-wide comparisons, this evaluation tested both the specificity and generalizability of the model's lexical output within each profile.
                  </p>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Q</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Segment</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Text Fragment</th>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Cosine Similarity</th>
                        <th className="px-4 py-2 text-left font-semibold">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She seems like a person with experience and preparation, someone who could handle the job."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.75</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">High lexical overlap with the dataset, using vocabulary common to the training data (e.g., "experience", "job").</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"Well yes, of course yes, it is a very good slogan because well yes, we live off effort..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.62</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Demonstrates the model's ability to reproduce colloquial features like filler expressions and repeated affirmations.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"I think slogans like that are pure populism. They manipulate emotions and avoid real policy."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.62</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Lexically accurate from the original corpus; uses analytical and ideological vocabulary common in participant speech.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She needs to connect more with the people and show concrete proposals."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.72</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Aligned with training vocabulary; expressions like "connect with people" and "concrete proposals" are typical in the original dataset.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-gray-700">
                  <p className="text-xs"><strong>Note:</strong> All text fragments were translated into English for the purposes of this analysis. Original responses were generated in Spanish.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setValidationSubPage('internal-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Results - Semantic Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'internal-semantic' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('internal-lexical');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Lexical Similarity
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">3. Semantic Similarity</h2>
            <div className="space-y-8">
              <div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p className="text-justify">
                    While lexical similarity focuses on exact word overlap, semantic similarity evaluates whether two texts convey similar meanings, even if they use different vocabulary. To measure this, we used <strong>sentence embeddings</strong>, which transform entire sentences into dense numerical vectors in a semantic space. These embeddings were generated using a pretrained transformer model (<strong>paraphrase-MiniLM-L6-v2 from SentenceTransformers</strong>), which captures nuances in phrasing, structure, and implied meaning.
                  </p>
                  <p className="text-justify">
                    Having mapped sentences to vectors, we quantified semantic proximity by calculating <strong>cosine similarity</strong> between embeddings of model-generated responses and those from the source dataset. A high cosine similarity score, in this case, signals that the model's output shares the same <strong>conceptual trajectory</strong> and <strong>argumentative structure</strong> as the benchmark, even when the lexical items differ.
                  </p>
                  <p className="text-justify">
                    The comparative analysis confined itself to the two benchmark questions embedded in the training corpus. For every participant profile and question, we derived <strong>cosine similarity</strong> between model-generated answers and focus group responses from the relevant corpus segment. To ascertain whether the model's responses were semantically nearer to or more distant from the dataset, we employed the <strong>Mann–Whitney U test</strong> on the resulting similarity scores.
                  </p>
                  <p className="text-justify">
                    This statistical procedure enabled us to ascertain whether the model had absorbed and reproduced the <strong>segment-specific discursive logic</strong>, <strong>reasoning architectures</strong>, and <strong>conceptual framings</strong> that transcend mere surface paraphrase.
                  </p>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Q</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Segment</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Text Fragment</th>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Semantic Similarity</th>
                        <th className="px-4 py-2 text-left font-semibold">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She is educated, she is a scientist and has experience in politics, but I'm not sure she connects with the people..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.58</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Capture this segment's vision of Claudia Sheinbaum's strengths that come from her academic and training, though with less nuance in phrasing.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"The biggest problems in my neighborhood are insecurity, poor public transport, and lack of lighting."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.65</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Semantically aligned with real discourse about daily urban challenges in Mexico city.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"...earn their position and live quite satisfactorily without having to ask for anything from anyone and expect anything from anyone"</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.54</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Aligned with Monterrey's values of hard work and dislike for social support.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"...It is like a kind of social revolution in Mexican society that we are all equal regardless of our economic, social, or educational position..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.61</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">It reflects the assessment of social problems in the CDMX segment, a vision of the people versus the privileged.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-gray-700">
                  <p className="text-xs"><strong>Note:</strong> All text fragments were translated into English for the purposes of this analysis. Original responses were generated in Spanish.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setValidationSubPage('external-main');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Validation</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'external-sentiment' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('external-main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to External Validation
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Results - Sentiment Analysis</h2>
            <div className="space-y-8">
              <div>
                <p className="text-justify text-gray-700 leading-relaxed">
                  The following results were obtained in the external validation.
                </p>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">Profile</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Question</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Model Sentiment</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Interviews Sentiment</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">t-test p</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">t-test significant</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Wilcoxon p</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Wilcoxon significant</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">KS p</th>
                        <th className="px-3 py-2 text-center font-semibold">KS significant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.118984</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.070763</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.066699</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.25</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">8.66E-02</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.230552</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.099033</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.025118</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.125</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.08658</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.081162</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.057069</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.626552</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.625</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.44777</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.127978</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.089282</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.517408</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.625</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.749482</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.11269</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.164309</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.590627</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.207039</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.158285</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.075175</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.009358</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.125</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.013175</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.0723</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.130239</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.913708</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.875</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.749482</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.135208</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.058371</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.180309</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.25</td>
                        <td className="px-3 py-2 text-center border-r border-dashed border-[#95B1EE]">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.08658</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div className="space-y-8">
                  {/* Primera imagen: ExtSent01.png */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtSent01.png" 
                      alt="External Sentiment Analysis - Chart 1" 
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Segunda imagen: ExtSent02.png */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtSent02.png" 
                      alt="External Sentiment Analysis - Chart 2" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setValidationSubPage('external-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Results - Lexical Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'external-lexical' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('external-sentiment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Sentiment Analysis
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Results - Lexical Similarity</h2>
            <div className="space-y-8">
              <div>
                <p className="text-justify text-gray-700 leading-relaxed">
                  The following results were obtained in the external validation.
                </p>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">Profile</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Question</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Model CosSim vs Interview Answers</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Mann-Whitney p</th>
                        <th className="px-3 py-2 text-center font-semibold">Significant (p &lt; 0.05)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.664892</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.01</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.354434</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0004</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.57989</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0004</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.669012</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0177</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.429709</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0004</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.529842</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0008</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.442684</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0008</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.565725</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.2405</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div className="space-y-8">
                  {/* Primera fila: ExtLex01 y ExtLex02 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                      <img 
                        src="/ExtLex01.png" 
                        alt="External Lexical Similarity Analysis - Chart 1" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                      <img 
                        src="/ExtLex02.png" 
                        alt="External Lexical Similarity Analysis - Chart 2" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* Segunda imagen: ExtLex03 */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtLex03.png" 
                      alt="External Lexical Similarity Analysis - Chart 3" 
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Tercera imagen: ExtLex04 */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtLex04.png" 
                      alt="External Lexical Similarity Analysis - Chart 4" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setValidationSubPage('external-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Results - Semantic Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {validationSubPage === 'external-semantic' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('external-lexical');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Lexical Similarity
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Results - Semantic Similarity</h2>
            <div className="space-y-8">
              <div>
                <p className="text-justify text-gray-700 leading-relaxed">
                  The following results were obtained in the external validation.
                </p>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">Profile</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Question</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">SemSim Model vs Dataset Answers</th>
                        <th className="px-3 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Mann-Whitney p</th>
                        <th className="px-3 py-2 text-center font-semibold">Significant (p &lt; 0.05)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.483006</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0147</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.155695</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0958</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.619091</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0008</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">CDMX / 18-25 y.o. / C-D+</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.401177</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0034</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.283566</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.5612</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.346277</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.7863</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.101455</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.8464</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE] w-80 whitespace-nowrap">MTY / 35-55 y.o. / C+B</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.252968</td>
                        <td className="px-3 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.0228</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <div className="space-y-8">
                  {/* Primera fila: ExtSem01 y ExtSem02 */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                      <img 
                        src="/ExtSem01.png" 
                        alt="External Semantic Similarity Analysis - Chart 1" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                      <img 
                        src="/ExtSem02.png" 
                        alt="External Semantic Similarity Analysis - Chart 2" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* Segunda imagen: ExtSem03 */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtSem03.png" 
                      alt="External Semantic Similarity Analysis - Chart 3" 
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Tercera imagen: ExtSem04 */}
                  <div className="bg-white p-4 rounded-lg border border-[#E7F1A8] shadow-sm">
                    <img 
                      src="/ExtSem04.png" 
                      alt="External Semantic Similarity Analysis - Chart 4" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


        </>
      )}

      {validationSubPage === 'learnings' && (
        <>
          <button
            onClick={() => {
              setValidationSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Results & Validation
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Learnings</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A6B] mb-4">Key Insights</h3>
                <ContentPlaceholder height="h-32" text="Placeholder for key learnings, insights, and discoveries from the validation process" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A6B] mb-4">Methodological Reflections</h3>
                <ContentPlaceholder height="h-32" text="Placeholder for methodological insights and reflections on the approach" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A6B] mb-4">Implications</h3>
                <ContentPlaceholder height="h-32" text="Placeholder for broader implications and significance of the findings" />
              </div>
            </div>
          </div>
        </>
      )}

      <NavigationButtons />
    </div>
  );

  const renderAnalysisPage = () => (
    <div className="max-w-5xl mx-auto">
      {analysisSubPage === 'main' && (
        <>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">Analysis & Insights</h1>
          </div>

          <div className="space-y-6 mb-12">
            <button
              onClick={() => {
                setAnalysisSubPage('internal-sentiment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Internal Analysis – Sentiment Analysis</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('internal-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Internal Analysis - Lexical Similarity</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('internal-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">Internal Analysis– Semantic Similarity</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('external-sample-size');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">External Analysis – Sample Size Considerations</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('external-sentiment-consistency');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">External Analysis – Sentiment Consistency with Real Interviews</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('external-lexical-interviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">External Analysis – Lexical Similarity with Real Interviews</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('external-semantic-interviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">External Analysis – Semantic Similarity with Real Interviews</h3>
            </button>

            <button
              onClick={() => {
                setAnalysisSubPage('external-qualitative');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group w-full p-4 bg-white rounded-xl shadow-sm border border-[#95B1EE] text-left transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-[#FFFDF5]"
            >
              <h3 className="text-xl font-bold text-[#2B3A6B]">External Analysis – Qualitative evaluation</h3>
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'internal-sentiment' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Internal Analysis – Sentiment Analysis</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    The sentiment evaluation reveals that the model tends to generate responses that are systematically more negative than those found in the original dataset. <strong>In the case of the CDMX 18–25 C-D+ segment, model outputs for Question 1 averaged −0.12, compared to −0.04 in the original data. For Question 2, the difference was even more pronounced, with model responses averaging −0.23 versus −0.11 in the dataset.</strong> Despite the seemingly small absolute differences, <strong>all three statistical tests (t-test, Wilcoxon, and KS) confirmed that these shifts were significant.</strong>
                  </p>
                  <p>
                    <strong>This tendency toward negative sentiment persists even when comparing model outputs to the overall training corpus.</strong> In other words, the model does not merely reflect localized pessimism from specific prompts; it introduces a broader affective distortion that skews more negative than the original data distribution.
                  </p>
                  <p>
                    Rather than amplifying sentiment already present in the corpus, <strong>the model appears to introduce a systematic affective drift.</strong> This could stem from fine-tuning artifacts, overfitting on emotionally charged examples, or a structural imbalance in how emotionally neutral versus critical responses were represented during training.
                  </p>
                  <p>
                    These findings raise important questions about the model's ability to replicate not just what participants say, but how they say it. <strong>Political discourse often relies on subtle affective cues like tones of irony, resignation, hope, or indignation that are not always captured by raw sentiment polarity.</strong> The model's tendency to skew more negative may reduce the credibility or authenticity of simulated responses, particularly in contexts where emotional nuance matters.
                  </p>
                  <p>
                    In sum, while the model succeeds in producing linguistically coherent answers, its affective calibration remains imperfect. <strong>A more refined tuning process or additional constraints may be necessary to ensure that sentiment generation aligns more closely with the emotional patterns observed in real political discourse.</strong>
                  </p>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Q</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Segment</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Text Fragment</th>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Sent Score</th>
                        <th className="px-4 py-2 text-left font-semibold">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"I see her as an intelligent or intellectual person... someone who has experience in those areas and could take on that role."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.10</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Moderately negative score, but conveys thoughtful evaluation and potential.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She's just another face of the same corrupt system. They don't care about people like us."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.23</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Significantly more negative, categorical rejection with no ambiguity.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"Insecurity and the lack of job opportunities... most of the industries here are maquiladoras that do not offer good wages."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.17</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Specific and grounded in local reality, moderately negative but reasoned.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"Insecurity, poverty, corruption, drug trafficking, abuse, suicide, terrorism, organized crime..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">-0.46</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Extremely negative and abstract, listing societal collapse without local context.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-gray-700">
                  <p className="text-xs"><strong>Note:</strong> All text fragments were translated into English for the purposes of this analysis. Original responses were generated in Spanish.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('internal-lexical');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Internal Analysis - Lexical Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'internal-lexical' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Internal Analysis - Lexical Similarity</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    La evaluación léxica revela que <strong>el modelo logra una alineación moderada a alta con el vocabulario utilizado por los participantes en el conjunto de datos original.</strong> En el caso de las respuestas CDMX 18–25 C-D+, la similitud coseno entre las respuestas generadas y las del conjunto de datos fue de 0.75 para la Pregunta 1, pero <strong>disminuyó a 0.47 para la Pregunta 2</strong>. Mientras que el primer resultado sugiere una reproducción exitosa del estilo léxico, el segundo <strong>indica dificultad para alinearse con el discurso utilizado en torno a problemas locales cotidianos</strong>, un tema presente en los datos de entrenamiento pero expresado con una amplia variación estilística. Las pruebas de Mann–Whitney mostraron que <strong>la diferencia en las puntuaciones de similitud para la Pregunta 2 fue estadísticamente significativa</strong>, lo que refuerza esta interpretación.
                  </p>
                  <p>
                    Cuando se comparó con el corpus completo de respuestas de grupos focales del mismo segmento demográfico, <strong>la similitud léxica se mantuvo consistentemente alta en todas las preguntas, con valores superiores a 0.80 para la mayoría de las indicaciones</strong>. Esto sugiere que <strong>el modelo internalizó patrones de vocabulario generales típicos de cada grupo</strong>, incluso al enfrentarse a indicaciones nuevas o sintéticas. Notablemente, <strong>la Pregunta 2 de CDMX volvió a mostrar una similitud menor con el corpus más amplio (0.53)</strong>, lo que indica que este tema fue más difícil de generalizar léxicamente.
                  </p>
                  <p>
                    En contraste, <strong>el modelo MTY 35–55 C+B exhibió resultados más estables en todas las preguntas</strong>, aunque persistió cierta variación. La Pregunta 4, un eslogan experimental no presente en el conjunto de datos original, <strong>produjo puntuaciones de similitud significativamente diferentes en comparación con la línea base del corpus</strong>, lo que sugiere que la flexibilidad léxica del modelo tiene límites bajo nuevas entradas ideológicas.
                  </p>
                  <p>
                    Estos hallazgos sugieren que, si bien <strong>el modelo funciona bien al reproducir el campo léxico de cada segmento, especialmente en temas familiares, puede desviarse en preguntas menos estructuradas o más cargadas contextualmente.</strong> La combinación de comparaciones dirigidas y de todo el corpus apoya la conclusión de que <strong>la coherencia léxica se conserva en general, pero puede fallar en los límites de la distribución de entrenamiento.</strong>
                  </p>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Q</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Segment</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Text Fragment</th>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Cosine Similarity</th>
                        <th className="px-4 py-2 text-left font-semibold">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She seems like a person with experience and preparation, someone who could handle the job."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.75</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">High lexical overlap with the dataset, using vocabulary common to the training data (e.g., "experience", "job").</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"Well yes, of course yes, it is a very good slogan because well yes, we live off effort..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.62</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Demonstrates the model's ability to reproduce colloquial features like filler expressions and repeated affirmations.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"I think slogans like that are pure populism. They manipulate emotions and avoid real policy."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.62</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Lexically accurate from the original corpus; uses analytical and ideological vocabulary common in participant speech.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She needs to connect more with the people and show concrete proposals."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.72</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Aligned with training vocabulary; expressions like "connect with people" and "concrete proposals" are typical in the original dataset.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-gray-700">
                  <p className="text-xs"><strong>Note:</strong> All text fragments were translated into English for the purposes of this analysis. Original responses were generated in Spanish.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('internal-semantic');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">Internal Analysis– Semantic Similarity</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'internal-semantic' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Internal Analysis– Semantic Similarity</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    Semantic similarity scores between model-generated responses and dataset answers show <strong>moderate alignment</strong> across both profiles. In the CDMX 18–25 C-D+ segment, similarity averaged <strong>0.48 for Question 1 and 0.56 for Question 2</strong>. In the MTY 35–55 C+B segment, values ranged from <strong>0.34 (Q1) to 0.51 (Q2)</strong>. These scores indicate that the <strong>model captures a reasonable portion of the underlying meaning</strong> expressed by participants, even if it does not fully replicate their discursive structure.
                  </p>
                  <p>
                    Importantly, <strong>no significant differences were found in the distribution of similarity scores</strong> for any question-profile pair. Mann–Whitney U tests yielded p-values above the 0.05 threshold in all cases, suggesting that the <strong>model's answers are semantically comparable in structure and conceptual content to real responses within each segment</strong>. While the scores are not high enough to indicate near-perfect alignment, they <strong>confirm that the model is not hallucinating content or diverging meaningfully in logic or topic.</strong>
                  </p>
                  <p>
                    The <strong>model performs slightly better on Question 2</strong> across both segments, which may reflect the nature of the prompt. That question addressed local problems, a topic that tends to elicit more focused and structured responses, thus making it easier for the model to match intent and argumentative framing.
                  </p>
                  <p>
                    Overall, the semantic evaluation suggests that while the <strong>model does not mirror participant reasoning verbatim, it produces responses that fall within the expected conceptual space for each demographic</strong>. This <strong>supports its potential as a tool for simulating plausible political discourse</strong>, with the caveat that deeper nuance and framing variation may still require improvement.
                  </p>
                </div>
              </div>
              <div>
                <div className="overflow-x-auto bg-white rounded-lg border-2 border-[#2B3A6B] shadow-sm">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#2B3A6B] text-[#ECE9DF]">
                      <tr>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Q</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Segment</th>
                        <th className="px-4 py-2 text-left font-semibold border-r border-dashed border-[#95B1EE]">Text Fragment</th>
                        <th className="px-4 py-2 text-center font-semibold border-r border-dashed border-[#95B1EE]">Semantic Similarity</th>
                        <th className="px-4 py-2 text-left font-semibold">Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-[#95B1EE]">
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">1</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"She is educated, she is a scientist and has experience in politics, but I'm not sure she connects with the people..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.58</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Capture this segment's vision of Claudia Sheinbaum's strengths that come from her academic and training, though with less nuance in phrasing.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">2</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"The biggest problems in my neighborhood are insecurity, poor public transport, and lack of lighting."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.65</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Semantically aligned with real discourse about daily urban challenges in Mexico city.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">3</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">MTY 35–55 C+B</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"...earn their position and live quite satisfactorily without having to ask for anything from anyone and expect anything from anyone"</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.54</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">Aligned with Monterrey's values of hard work and dislike for social support.</td>
                      </tr>
                      <tr className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">4</td>
                        <td className="px-4 py-2 text-[#2B3A6B] font-medium border-r border-dashed border-[#95B1EE]">CDMX 18–25 C-D+</td>
                        <td className="px-4 py-2 text-[#4A4A4A] italic border-r border-dashed border-[#95B1EE]">"...It is like a kind of social revolution in Mexican society that we are all equal regardless of our economic, social, or educational position..."</td>
                        <td className="px-4 py-2 text-center text-[#4A4A4A] border-r border-dashed border-[#95B1EE]">0.61</td>
                        <td className="px-4 py-2 text-[#4A4A4A]">It reflects the assessment of social problems in the CDMX segment, a vision of the people versus the privileged.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-gray-700">
                  <p className="text-xs"><strong>Note:</strong> All text fragments were translated into English for the purposes of this analysis. Original responses were generated in Spanish.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('external-sample-size');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Analysis – Sample Size Considerations</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'external-sample-size' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Analysis – Sample Size Considerations</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    The external evaluation involved eight interviews, four per profile, with each participant answering all four benchmark questions. This yielded four real responses per profile-question pair, which were then compared against the 20 model-generated responses for the same question and segment. All statistical tests, t-tests, Wilcoxon, and Kolmogorov–Smirnov, were conducted independently for each question-profile pair, <strong>never pooling responses across questions or segments</strong>.
                  </p>
                  <p>
                    Although this configuration seems to allow statistical comparison, the structure comes with some <strong>key restrictions that must be noted</strong>:
                  </p>
                  <p>
                    <strong>The sample size imbalance</strong> is prominent with the model output serving as the benchmark as each responds only four responses in comparison to twenty model outputs. This imbalance <strong>significantly impacts the sensitivity of the tests</strong> being conducted and in turn the <strong>estimates of variance in models that include humans become highly unreliable</strong>.
                  </p>
                  <p>
                    <strong>Low statistical power:</strong> When the real sample is small, the average can be greatly affected. The restrictions put in place by non parametric tests is a helpful tool, however, the curt structure remains a problem regardless.
                  </p>
                  <p>
                    <strong>Caution in interpretation:</strong> <strong>Non-significant results do not confirm equivalence</strong>; they may reflect low power rather than true similarity.
                  </p>
                  <p>
                    These tests serve the purpose of being <strong>directional breaks as opposed to being precise benchmarks with set validation scope</strong>. The main purpose of these tests is to <strong>establish the plausibility of models</strong>.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('external-sentiment-consistency');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Analysis – Sentiment Consistency with Real Interviews</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'external-sentiment-consistency' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Analysis – Sentiment Consistency with Real Interviews</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    The external assessments mirror the internal review in observing that the <strong>model leans toward negativity more than interviewees</strong>. Only two of the eight stitched comparisons, however, achieved threshold significance (CDMX Question 2, p = 0.025; MTY Question 2, p = 0.009), both of which the t-test confirmed. Repeated Wilcoxon and KS evaluation, however, did not uphold these hits, drawing attention to the <strong>analysis's low statistical leverage from the small sample</strong>.
                  </p>
                  <p>
                    The small number of real responses (n = 4 per group) restricts the robustness of the analysis. These comparisons should be read as <strong>plausibility checks, not conclusive validation</strong>. Still, the repeated significance of Question 2 across segments suggests that the <strong>model may be particularly prone to amplifying negative sentiment when prompted with problems tied to local realities</strong>.
                  </p>
                  <p>
                    Overall, the alignment of sentiment seems achievable, yet the <strong>model repeatedly follows a negativity path</strong>. Upcoming work might need to focus on affect-sensitive tuning to be more accurate trying to mirror an emotional equilibrium found in conversations.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('external-lexical-interviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Analysis – Lexical Similarity with Real Interviews</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'external-lexical-interviews' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Analysis – Lexical Similarity with Real Interviews</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    To evaluate how effectively the model approximates the lexical repertoire and stylistic nuances of actual respondents, we calculated cosine similarity between model-generated replies and interview transcripts for every question and participant profile.Each contrast employed identical prompts and was analyzed through Mann–Whitney U tests.
                  </p>
                  <p>
                    <strong>Seven out of eight comparisons showed statistically significant differences</strong> (p &lt; 0.05), indicating that the <strong>model's vocabulary often diverges from that of real speakers</strong>. This was true for both profiles and across all question types, including open-ended prompts (e.g., slogans) and evaluative ones (e.g., perceptions of López Obrador or local problems).
                  </p>
                  <p>
                    In the CDMX segment, Questions 1 (0.66) and 4 (0.67) showed the <strong>highest similarity scores, suggesting stronger lexical alignment</strong> when evaluating political figures and slogans. In contrast, Question 2 (0.35) had the <strong>lowest score, pointing to greater difficulty reproducing the way participants talk about concrete local problems</strong>.
                  </p>
                  <p>
                    The MTY dataset fell short of the CDMX scores, with majority similarities below 0.50. Questions 1 (0.43) and 3 (0.44) displayed <strong>pronounced lexical divergence</strong>, while Question 4 climbed to 0.56, the lone prompt in the segment to avoid significant divergence.
                  </p>
                  <p>
                    These results suggest that lexical alignment is generally moderate but <strong>systematically different from human responses</strong>. The model may rely on recurring patterns or overgeneralized expressions not present in the specific style or vocabulary used by real participants. Because these discrepancies are reproducible, raising lexical accuracy will likely demand focused adjustment using a broader, more colloquial corpus or the application of filtering rules to recalibrate specific word selections.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('external-semantic-interviews');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Analysis – Semantic Similarity with Real Interviews</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'external-semantic-interviews' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Analysis – Semantic Similarity with Real Interviews</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    In the CDMX segment, <strong>three out of four comparisons yielded statistical differences</strong>, with Questions 1 (0.48), 3 (0.62), and 4 (0.40) demonstrating moderate to quasi strong semantic association. Question 2, however, with the lowest similarity of 0.16, was not significant (p = 0.0958) suggesting both <strong>weak alignment and a high degree of variation in actual responses</strong>.
                  </p>
                  <p>
                    In the MTY segment, the MTY similarity semantic differences were lower in all questions. Only Question 4 (0.25) had a significant difference. For questions 1 to 3, their similarity scores clustered in the low to moderate range (0.10 to 0.35), suggesting a <strong>lack of independence among the responses, which in all likelihood represents a homogeneous response set among the few interview responses instead of actual alignment</strong>.
                  </p>
                  <p>
                    These findings suggest the <strong>model performs adequately in capturing semantic meaning in the CDMX segment</strong>, particularly in Questions 1 and 3, but performs <strong>consistently weak in MTY</strong>. This could suggest <strong>semantic regional patterns are poorly represented in the model's training data</strong>. Strengthening alignment may not result solely from fine-tuning, but require additional targeted exposure to local reasoning and contextual frameworks.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => {
                setAnalysisSubPage('external-qualitative');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
            >
              <span className="mr-2">External Analysis – Qualitative evaluation</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {analysisSubPage === 'external-qualitative' && (
        <>
          <button
            onClick={() => {
              setAnalysisSubPage('main');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6 flex items-center text-[#2B3A6B] hover:text-[#ECE9DF] transition-colors duration-200"
          >
            <ArrowRight size={20} className="transform rotate-180 mr-2" />
            Back to Analysis & Insights
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">External Analysis – Qualitative evaluation</h2>
            <div className="space-y-8">
              <div>
                <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
                  <p>
                    In evaluating the qualitative performance of the models designed to simulate differentiated socioeconomic profiles (<strong>CDMX_C-D+_18–25</strong> and <strong>MTY_C+B_35–55</strong>), a principal tension emerges between <strong>fidelity to the targeted discursive intent</strong> and <strong>fluctuations in technical coherence</strong>. Mean scores for individual prompts hover between 5 and 6 on a 10-point scale; yet we classify the models' aggregate performance as superior, yielding a simulation capacity that convincingly approximates the segment's <strong>tone, ideological slant, and hierarchical selection of issues</strong>.
                  </p>
                  <p>
                    In the case of the <strong>CDMX_C-D+_18–25 model</strong>, a clear ability was observed to replicate <strong>youth and working-class speech patterns</strong>: use of conversational markers (<strong>"pues yo siento que…"</strong>), <strong>emotional ambivalence</strong>, and a <strong>positive valuation of state support</strong>. These features aligned with what the original corpus showed as discursive traits of the segment. However, multiple responses displayed serious formal flaws, such as automatic repetitions, loss of coherence, or syntactic loops. These limitations reduced the individual score of many answers, but they do not negate the fact that the model successfully incorporated key elements of the group's discursive positioning.
                  </p>
                  <p>
                    The <strong>MTY_C+B_35–55 model</strong>, on the other hand, presented a more <strong>structured discourse, oriented toward technical analysis of the topics</strong>. A <strong>critical stance toward assistentialism and populism</strong> was regularly observed, along with a <strong>positive view of concepts such as merit, individual effort, and institutional transparency</strong>. These responses, aligned with a technocratic and rational ethos, reinforce the model's credibility in simulating a socioeconomic profile associated with classic liberal and conservative values. Again, despite the presence of erratic or repetitive outputs, the model maintained an <strong>ideological and discursive coherence</strong> that outweighs its occasional generation flaws.
                  </p>
                  <p>
                    This disparity between moderate individual scores and a more favorable overall evaluation is explained by the <strong>non-linear nature of the applied scale</strong>. In text generation contexts, a <strong>"regular" response (5 or 6) may be sufficient</strong> for the model to be useful in exploratory or strategic simulation scenarios. Moreover, when these responses accumulate with thematic coherence and tonal fidelity, the model acquires an <strong>aggregate functionality that exceeds the limitations of each fragment</strong>.
                  </p>
                  <p>
                    This finding strongly suggests that judges of generative models operating from qualitative premises cannot permit themselves to be seduced by numerical precision alone. Attempts to gauge alignment between output and intended target must engage the <strong>discursive contours and normative commitments</strong> of the groups being simulated. When assessed across the relevant segmental differentiations, the models examined here reveal sufficient distinction to be conceived as <strong>legitimate qualitative probes</strong>, particularly in the domain of political theory where the articulation of contexts, contingencies, and normative orientations remains paramount.
                  </p>
                </div>
              </div>

            </div>
          </div>


        </>
      )}

      <NavigationButtons />
    </div>
  );

  const renderLimitationsPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">Limitations & Ethical Considerations</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
          <p>
            In any research context, ethics play an essential role in framing the outcomes and results. Therefore, in the case of the given prototype its usefulness needs to be approached from an <strong>ethical and methodological perspective</strong>. In other words, it is worth highlighting its <strong>risks and potential</strong> in order to avoid misuse in the future.
          </p>
          <p>
            <strong>Epistemological and technical limitations.</strong><br />
            The results of the model in no case reflect the <strong>truthful opinions of individuals</strong>, moreover, it is important to state that its outputs are just <strong>simulations of probabilities</strong>. Simulations can be improved through real qualitative data, but it also brings up such challenges as generalization errors, overfitting, and token bias. Another important thing is that the model was evaluated internally and externally and it was noted that its <strong>predictive capabilities were limited</strong>. Therefore, it is reasonable to assume that some of its outputs can be <strong>biased and amplified</strong> depending on the original input thus warranting further analysis.
          </p>
          <p>
            <strong>Risks of overtrust and misapplication.</strong><br />
            Because of the <strong>fluency and coherence of LLM generated text</strong>, there is the possibility that users misjudge the <strong>accuracy of model outputs</strong>. Without human oversight, these simulations should not be misused as empirical evidence, simulations, and model outputs should not be used to justify strategic decisions. Their purpose is not to provide incontrovertible evidence; simulations are used only as <strong>relatively plausible illustrations</strong>, and their credibility depends on the judgment of <strong>expert interpreters</strong> who possess relevant knowledge and are sufficiently well-versed with the simulations.
          </p>
          <p>
            <strong>Limits of human nuance and dialogic depth.</strong><br />
            Unlike qualitative fieldwork in-person interviews, which trained moderators can evaluate with irony, tone, and body language, <strong>simulated interactions remain text-bound and context-poor</strong>. Human facilitators can build rapport, which allows them to earn the trust of participants and encourage more candid, emotive, and resonant responses. Moreover, the flow of real conversations allows moderators to pursue certain lines of reasoning and deepen them with follow-up questions and emergent probes. In contrast, language models respond to inputs as an <strong>amalgamation of branching possibilities</strong> based across several threads of discourse, often lacking coherent continuity within the response.
          </p>
          <p>
            <strong>Avoiding stereotypical representations.</strong> A common concern when simulating demographic segments is the risk of <strong>reinforcing stereotypes or essentializing group identities</strong>. This critique is valid and must be taken seriously. Any system that claims to <strong>"speak like" a population group</strong> runs the risk of reducing complex subjectivities to simplified caricatures. This project, however, actively resists that tendency by grounding its simulations in the <strong>actual voices of real participants</strong> captured in more than 300 focus group transcripts. Instead of using synthetic profiles or aggregated traits, the models are exposed to the <strong>contradictions, hesitations, and even the ambivalences that define real political speech</strong>. Far from producing homogeneous or flattened outputs, the models display a <strong>wide expressive range</strong>, even within the same segment, mirroring the internal diversity of real groups. This is not only a technical outcome but a methodological choice.Rather than imposing externally predefined archetypes on a demographic label, the model takes in the <strong>multitude of viewpoints from within the group itself</strong>. In reflecting this, the model captures a <strong>discursive rather than essentialist logic of identity</strong>, where political subjectivity is always situated, relational, and in flux.
          </p>
          <p>
            In sum, the promise of language-based voter simulations lies not in replacing human research, but in <strong>augmenting its reach under strict methodological and ethical constraints</strong>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Overall Conclusions – Key Points</h2>
        <div className="text-gray-700 text-justify space-y-4 leading-relaxed">
          <p>
            Expecting a <strong>fine-tuned model</strong> trained on real political conversations to produce clear, precise, and consistent responses may be a <strong>contradiction in itself</strong>. Human discourse, especially in focus groups, is rarely linear or coherent. It is shaped by <strong>hesitation</strong>, <strong>emotional ambivalence</strong>, and the coexistence of <strong>contradictory beliefs</strong>. This project does not aim to extract a single "correct" answer from a simulated respondent, but rather to approximate the <strong>richness and complexity of collective discourse</strong>. When used with the interpretive guidance of a researcher familiar with the target segments, these models can provide <strong>valuable insight</strong>, not because each response is flawless, but because the ensemble reflects <strong>recognizable tones</strong>, <strong>tensions</strong>, and <strong>ideological tendencies</strong>. The following conclusions are drawn with this framework in mind: the models are not perfect mirrors of human reasoning, but they do succeed in capturing enough of its <strong>structure and subjectivity</strong> to be considered <strong>plausible</strong>, <strong>strategically useful</strong>, and <strong>worthy of further development</strong>.
          </p>
          
          <ul className="list-disc list-inside space-y-4 ml-4">
            <li>
              <strong>Discursive fidelity by segment</strong><br />
              Both models successfully captured the ideological tone and expressive style of their target segments. The CDMX model reflects youthful, ambivalent, and colloquial speech patterns, while the MTY model exhibits structured, analytical discourse with an emphasis on effort, merit, and skepticism toward populism.
            </li>
            
            <li>
              <strong>Consistent affective bias</strong><br />
              The models exhibited a consistent inclination to produce more negative outputs than the actual participants in both internal and external sentiment analyses. This points to an amplification in the kinds of critical responses the models have learned to generate.
            </li>
            
            <li>
              <strong>Lexical appropriation with limits</strong><br />
              The model successfully simulates the lexical skills of participants in each segment. It also demonstrates the use of filler words, characteristic phrases, word repetition, and linguistic inconsistencies. However, there is room for improvement in Lexical Similarity to higher levels.
            </li>
            
            <li>
              <strong>Moderate semantic plausibility</strong><br />
              Semantic similarity scores showed that while the models did not perfectly mirror participant reasoning, they remained within the expected conceptual space. This reinforces their potential for generating plausible interpretations of political discourse without hallucinating or deviating from core topics.
            </li>
            
            <li>
              <strong>Exploratory value despite formal flaws</strong><br />
              While individual responses may be imperfect or mechanically flawed, the models achieve functional realism in aggregate. Their outputs are ideologically consistent, contextually grounded, and discursively differentiated enough to serve as tools for message testing and hypothesis exploration.
            </li>
            
            <li>
              <strong>Validation supports cautious use</strong><br />
              Even with the collected data, both quantitative and qualitative tests were conducted to verify that the model's responses were plausible based on the simulated segments. We found glaring errors that make critical human oversight and validation of the model's responses impossible without them.
            </li>
          </ul>
          
          <p>
            <strong>Limitations of RAG and future architectural considerations</strong><br />
            While Retrieval-Augmented Generation (RAG) was initially implemented to enhance factual grounding, it often constrained the model's expressive capacity. Due to Salamandra's relatively small context window, limiting input to only the top four retrieved blocks meant sacrificing the broader discursive richness available in the corpus. In many cases, the fine-tuned model alone produced more contextually coherent and stylistically aligned responses. For future iterations, I intend to explore architectures with extended context windows, where the entire corpus can be accessed via cache-based retrieval (CAG) instead of fragmentary RAG. This may offer a more integrated and expressive basis for generating answers that reflect the full depth of the underlying qualitative data.
          </p>
        </div>
      </div>

      <NavigationButtons />
    </div>
  );

  const renderResearcherPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">About the Researcher</h1>
      </div>

      <CollapsibleSection title="Biography and Background" defaultOpen={true}>
        <ContentPlaceholder height="h-64" text="Space for researcher biography, background, motivations, and contact information" />
      </CollapsibleSection>

      <NavigationButtons />
    </div>
  );

  const renderReferencesPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">References</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Bibliography</h2>
        <div className="text-gray-700 space-y-4 leading-relaxed">
          <p className="text-justify">
            Argyle, L. P., Busby, E. C., Gubler, J. R., Hepner, B., Lyman, A., & Wingate, D. (2025). <em>Arti-"fickle" intelligence: Using LLMs as a tool for inference in the political and social sciences</em>. arXiv. https://doi.org/10.48550/arXiv.2504.03822
          </p>
          <p className="text-justify">
            Abramson, C. M., Li, Z., & Dohan, D. (2023). <em>Qualitative coding in the computational era</em>. Socius: Sociological Research for a Dynamic World, 9, 1–16. https://doi.org/10.1177/23780231231198747
          </p>
          <p className="text-justify">
            Argyle, L. P., Goel, S., Lee, L., Reich, J., & Westwood, S. (2023). <em>Out of one, many: Using language models to simulate human samples</em>. Political Analysis, 31(3), 435–451. https://doi.org/10.1017/pan.2023.6
          </p>
          <p className="text-justify">
            Ashokkumar, A., Hewitt, L., Ghezae, I., & Willer, R. (2024). <em>Predicting results of social science experiments using large language models</em>. arXiv preprint. https://arxiv.org/abs/2404.01309
          </p>
          <p className="text-justify">
            Bisbee, J., Clinton, J. D., Dorff, C., Kenkel, B., & Larson, J. M. (2024). <em>Synthetic replacements for human survey data? The perils of large language models</em>. Political Analysis, 32(4), 401–416. https://doi.org/10.1017/pan.2024.5
          </p>
          <p className="text-justify">
            Gao, C., Lan, X., Li, N., Zhou, Z., Yuan, Y., Ding, J., Xu, F., & Li, Y. (2024). <em>Large language models empowered agent-based modeling and simulation: A survey and perspectives</em>. Humanities and Social Sciences Communications, 11, Article 72. https://doi.org/10.1057/s41599-024-02420-0
          </p>
          <p className="text-justify">
            Halperin, S., & Heath, O. (2020). <em>Political research: Methods and practical skills</em> (3rd ed.). Oxford University Press.
          </p>
          <p className="text-justify">
            Karpf, D., Kreiss, D., Nielsen, R. K., & Powers, M. (2015). <em>The role of qualitative methods in political communication research: Past, present, and future</em>. International Journal of Communication, 9, 1888–1906. http://ijoc.org
          </p>
          <p className="text-justify">
            Lim, W. M. (2024). <em>What is qualitative research? An overview and guidelines</em>. Australasian Marketing Journal, 33(2), 199–229. https://doi.org/10.1177/14413582241264619
          </p>
          <p className="text-justify">
            Park, J. S., Zou, C. Q., Shaw, A., Hill, B. M., Cai, C., Morris, M. R., Willer, R., Liang, P., & Bernstein, M. S. (2023). <em>Generative agent simulations of 1,000 people</em>. In Proceedings of the 36th Annual ACM Symposium on User Interface Software and Technology (pp. 855–870). https://doi.org/10.1145/3586183.3606779
          </p>
          <p className="text-justify">
            Tretter, M. (2025). <em>Opportunities and challenges of AI-systems in political decision-making contexts</em>. Frontiers in Political Science, 7, Article 1504520. https://doi.org/10.3389/fpos.2025.1504520
          </p>
        </div>
      </div>

      <NavigationButtons />
    </div>
  );

  const renderConclusionsPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-[#2B3A6B] mb-4">Overall Conclusions</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#95B1EE] p-8 mb-8">
        <div className="text-gray-700 text-justify space-y-6 leading-relaxed">
          <h2 className="text-2xl font-bold text-[#2B3A6B] mb-6">Overall Conclusions – Key Points</h2>
          <p className="text-justify leading-relaxed">
            Expecting a fine-tuned model trained on real political conversations to produce clear, precise, and consistent responses may be a contradiction in itself. Human discourse, especially in focus groups, is rarely linear or coherent. It is shaped by hesitation, emotional ambivalence, and the coexistence of contradictory beliefs. This project does not aim to extract a single "correct" answer from a simulated respondent, but rather to approximate the richness and complexity of collective discourse. When used with the interpretive guidance of a researcher familiar with the target segments, these models can provide valuable insight, not because each response is flawless, but because the ensemble reflects recognizable tones, tensions, and ideological tendencies. The following conclusions are drawn with this framework in mind: the models are not perfect mirrors of human reasoning, but they do succeed in capturing enough of its structure and subjectivity to be considered plausible, strategically useful, and worthy of further development.
          </p>
          <div className="space-y-4">
            <div>
              • <strong>Discursive fidelity by segment</strong>
              <div className="ml-8 mt-2">
                Both models successfully captured the ideological tone and expressive style of their target segments. The CDMX model reflects youthful, ambivalent, and colloquial speech patterns, while the MTY model exhibits structured, analytical discourse with an emphasis on effort, merit, and skepticism toward populism.
              </div>
            </div>
            <div>
              • <strong>Consistent affective bias</strong>
              <div className="ml-8 mt-2">
                The models exhibited a consistent inclination to produce more negative outputs than the actual participants in both internal and external sentiment analyses. This points to an amplification in the kinds of critical responses the models have learned to generate.
              </div>
            </div>
            <div>
              • <strong>Lexical appropriation with limits</strong>
              <div className="ml-8 mt-2">
                The model successfully simulates the lexical skills of participants in each segment. It also demonstrates the use of filler words, characteristic phrases, word repetition, and linguistic inconsistencies. However, there is room for improvement in Lexical Similarity to higher levels.
              </div>
            </div>
            <div>
              • <strong>Moderate semantic plausibility</strong>
              <div className="ml-8 mt-2">
                Semantic similarity scores showed that while the models did not perfectly mirror participant reasoning, they remained within the expected conceptual space. This reinforces their potential for generating plausible interpretations of political discourse without hallucinating or deviating from core topics.
              </div>
            </div>
            <div>
              • <strong>Exploratory value despite formal flaws</strong>
              <div className="ml-8 mt-2">
                While individual responses may be imperfect or mechanically flawed, the models achieve functional realism in aggregate. Their outputs are ideologically consistent, contextually grounded, and discursively differentiated enough to serve as tools for message testing and hypothesis exploration.
              </div>
            </div>
            <div>
              • <strong>Validation supports cautious use</strong>
              <div className="ml-8 mt-2">
                Even with the collected data, both quantitative and qualitative tests were conducted to verify that the model's responses were plausible based on the simulated segments. We found glaring errors that make critical human oversight and validation of the model's responses impossible without them.
              </div>
            </div>
            <div>
              • <strong>Limitations of RAG and future architectural considerations</strong>
              <div className="ml-8 mt-2">
                While Retrieval-Augmented Generation (RAG) was initially implemented to enhance factual grounding, it often constrained the model's expressive capacity. Due to Salamandra's relatively small context window, limiting input to only the top four retrieved blocks meant sacrificing the broader discursive richness available in the corpus. In many cases, the fine-tuned model alone produced more contextually coherent and stylistically aligned responses. For future iterations, I intend to explore architectures with extended context windows, where the entire corpus can be accessed via cache-based retrieval (CAG) instead of fragmentary RAG. This may offer a more integrated and expressive basis for generating answers that reflect the full depth of the underlying qualitative data.
              </div>
            </div>
          </div>
        </div>
      </div>

      <NavigationButtons />
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home': return renderHomePage();
      case 'problem': return renderProblemPage();
      case 'proposal': return renderProposalPage();
      case 'built': return renderBuiltPage();
      case 'demo': return renderDemoPage();
      case 'validation': return renderValidationPage();
      case 'analysis': return renderAnalysisPage();
      case 'limitations': return renderLimitationsPage();
      case 'conclusions': return renderConclusionsPage();
      case 'researcher': return renderResearcherPage();
      case 'references': return renderReferencesPage();
      default: return renderHomePage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-[#2B3A6B] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 bg-[#ECE9DF] text-[#2B3A6B] rounded-full transition-all duration-300 hover:bg-[#F5F3F0] hover:scale-105"
              >
                <span className="font-semibold">Menu</span>
                <ChevronDown className={`transform transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''} text-[#2B3A6B]`} size={20} />
              </button>

              {isMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-[#95B1EE] z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setCurrentPage('home');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-6 py-4 text-left transition-all duration-200 hover:bg-[#95B1EE] hover:text-[#FFFDF5] border-b border-[#95B1EE] text-[#2B3A6B]"
                  >
                    <span className="font-medium text-[#2B3A6B]">Home</span>
                  </button>
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setCurrentPage(page.id);
                        if (page.id === 'built') {
                          setBuiltSubPage('main');
                        }
                        if (page.id === 'validation') {
                          setValidationSubPage('main');
                        }
                        if (page.id === 'analysis') {
                          setAnalysisSubPage('main');
                        }
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-6 py-4 text-left transition-all duration-200 hover:bg-[#ECE9DF] hover:text-[#2B3A6B] border-b border-[#95B1EE] last:border-b-0 text-[#2B3A6B]"
                    >
                      <span className="font-medium text-[#2B3A6B]">{page.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentPage('home')}
              className="text-2xl font-bold text-[#ECE9DF] transition-colors duration-200 hover:text-[#F5F3F0]"
            >
              Capstone Project
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-16 px-6">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <footer className="bg-[#ECE9DF] text-[#2B3A6B] py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="border-t border-[#2B3A6B] pt-8">
            <p className="text-[#2B3A6B]">[Footer content placeholder - University name, year, etc.]</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

