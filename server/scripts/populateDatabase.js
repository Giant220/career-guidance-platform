const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const populateDatabase = async () => {
  console.log('🚀 Starting comprehensive database population...');

  // Clear existing data (optional - remove in production)
  // await clearExistingData();

  // Populate institutions and courses
  await populateInstitutions();
  
  // Create admin user
  await createAdminUser();
  
  // Create sample companies and jobs
  await populateCompaniesAndJobs();
  
  console.log('🎉 Database population completed!');
};

const populateInstitutions = async () => {
  const institutions = [
    {
      id: 'nul',
      name: 'National University of Lesotho (NUL)',
      type: 'University',
      location: 'Roma, Lesotho',
      email: 'admissions@nul.ls',
      phone: '+26622340601',
      website: 'https://www.nul.ls',
      status: 'approved',
      description: 'Premier university offering diverse programs across multiple faculties',
      established: '1945',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Humanities',
          courses: [
            {
              id: 'nul-ba-humanities',
              name: 'BA Humanities',
              duration: '3 years',
              requirements: ['English C', 'History C', 'Any other 3 subjects with D or better'],
              description: 'Bachelor of Arts in Humanities focusing on critical thinking and cultural studies',
              fees: 'M25,000 per year',
              credits: '360',
              careerPaths: ['Teaching', 'Research', 'Cultural Affairs', 'Museum Curator'],
              intake: 'January, August'
            },
            {
              id: 'nul-ba-social-sciences',
              name: 'BA Social Sciences',
              duration: '3 years',
              requirements: ['English C', 'Mathematics D', 'Any Social Science subject C', 'Two other subjects D'],
              description: 'Bachelor of Arts in Social Sciences covering sociology, psychology and political science',
              fees: 'M25,000 per year',
              credits: '360',
              careerPaths: ['Social Work', 'Community Development', 'Public Administration', 'Research'],
              intake: 'January, August'
            },
            {
              id: 'nul-dip-theology',
              name: 'Diploma in Theology',
              duration: '2 years',
              requirements: ['English C', 'Religious Studies C', 'Three other subjects with D or better'],
              description: 'Diploma program for theological studies and religious leadership',
              fees: 'M20,000 per year',
              credits: '240',
              careerPaths: ['Religious Ministry', 'Community Leadership', 'Counseling'],
              intake: 'January'
            },
            {
              id: 'nul-dip-translation',
              name: 'Diploma in Translation & Interpretation',
              duration: '2 years',
              requirements: ['English B', 'Sesotho B', 'Three other subjects with C or better'],
              description: 'Professional diploma for translation and interpretation services',
              fees: 'M22,000 per year',
              credits: '240',
              careerPaths: ['Translator', 'Interpreter', 'Language Specialist', 'Diplomatic Services'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Science & Technology',
          courses: [
            {
              id: 'nul-bsc-computer-science',
              name: 'BSc Computer Science',
              duration: '4 years',
              requirements: ['Mathematics B', 'English C', 'Physics C', 'Computer Studies C'],
              description: 'Comprehensive computer science program covering programming, algorithms and systems',
              fees: 'M30,000 per year',
              credits: '480',
              careerPaths: ['Software Developer', 'Systems Analyst', 'IT Manager', 'Database Administrator'],
              intake: 'January, August'
            },
            {
              id: 'nul-bsc-electronics',
              name: 'BSc Electronics',
              duration: '4 years',
              requirements: ['Mathematics B', 'Physics B', 'English C', 'Chemistry C'],
              description: 'Electronics engineering program focusing on circuit design and telecommunications',
              fees: 'M30,000 per year',
              credits: '480',
              careerPaths: ['Electronics Engineer', 'Telecommunications Specialist', 'Control Systems Engineer'],
              intake: 'January, August'
            },
            {
              id: 'nul-bsc-food-science',
              name: 'BSc Food Science & Technology',
              duration: '4 years',
              requirements: ['Mathematics C', 'Chemistry C', 'Biology C', 'English C'],
              description: 'Food processing, preservation and safety technology program',
              fees: 'M28,000 per year',
              credits: '480',
              careerPaths: ['Food Technologist', 'Quality Control Manager', 'Food Safety Officer'],
              intake: 'January'
            },
            {
              id: 'nul-bsc-geology',
              name: 'BSc Geology',
              duration: '4 years',
              requirements: ['Mathematics C', 'Geography C', 'Physics C', 'English C'],
              description: 'Geological sciences program with focus on mineral exploration and environmental geology',
              fees: 'M28,000 per year',
              credits: '480',
              careerPaths: ['Geologist', 'Mining Engineer', 'Environmental Consultant', 'Hydrogeologist'],
              intake: 'January'
            },
            {
              id: 'nul-bsc-textile',
              name: 'BSc Textile Science',
              duration: '4 years',
              requirements: ['Mathematics C', 'Chemistry C', 'Physics D', 'English C'],
              description: 'Textile manufacturing, design and technology program',
              fees: 'M27,000 per year',
              credits: '480',
              careerPaths: ['Textile Engineer', 'Quality Controller', 'Production Manager', 'Fashion Technologist'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Health Sciences',
          courses: [
            {
              id: 'nul-bsc-nursing',
              name: 'Bachelor of Nursing',
              duration: '4 years',
              requirements: ['Biology B', 'Chemistry C', 'Mathematics C', 'English C', 'Physics D'],
              description: 'Comprehensive nursing science program with clinical practice',
              fees: 'M35,000 per year',
              credits: '480',
              careerPaths: ['Registered Nurse', 'Nurse Educator', 'Clinical Nurse Specialist'],
              intake: 'January'
            },
            {
              id: 'nul-bsc-pharmacy',
              name: 'Bachelor of Pharmacy',
              duration: '5 years',
              requirements: ['Chemistry B', 'Biology B', 'Mathematics B', 'Physics C', 'English C'],
              description: 'Pharmacy degree program preparing students for pharmaceutical practice',
              fees: 'M40,000 per year',
              credits: '600',
              careerPaths: ['Pharmacist', 'Pharmaceutical Researcher', 'Drug Inspector'],
              intake: 'January'
            },
            {
              id: 'nul-dip-nursing',
              name: 'Diploma in General Nursing',
              duration: '3 years',
              requirements: ['Biology C', 'Chemistry C', 'Mathematics D', 'English C'],
              description: 'Diploma program for general nursing practice',
              fees: 'M25,000 per year',
              credits: '360',
              careerPaths: ['Enrolled Nurse', 'Community Health Nurse'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Education',
          courses: [
            {
              id: 'nul-bed-secondary',
              name: 'BEd Secondary',
              duration: '4 years',
              requirements: ['English C', 'Mathematics D', 'Two teaching subjects at C', 'One other subject D'],
              description: 'Secondary education teaching degree with subject specialization',
              fees: 'M22,000 per year',
              credits: '480',
              careerPaths: ['Secondary School Teacher', 'Education Officer', 'Curriculum Developer'],
              intake: 'January, August'
            },
            {
              id: 'nul-bed-primary',
              name: 'BEd Primary',
              duration: '4 years',
              requirements: ['English C', 'Mathematics D', 'Science D', 'Social Studies D'],
              description: 'Primary education teaching degree',
              fees: 'M22,000 per year',
              credits: '480',
              careerPaths: ['Primary School Teacher', 'Early Childhood Educator', 'Education Administrator'],
              intake: 'January, August'
            },
            {
              id: 'nul-dip-education',
              name: 'Diploma in Education',
              duration: '2 years',
              requirements: ['English C', 'Mathematics D', 'Any two subjects with C', 'LGCSE Certificate'],
              description: 'Teaching diploma for secondary school education',
              fees: 'M18,000 per year',
              credits: '240',
              careerPaths: ['Teacher', 'Education Assistant'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Agriculture',
          courses: [
            {
              id: 'nul-bsc-agriculture',
              name: 'BSc Agriculture',
              duration: '4 years',
              requirements: ['Biology C', 'Chemistry C', 'Mathematics C', 'English C'],
              description: 'Agricultural sciences program covering crop production, animal science and agribusiness',
              fees: 'M26,000 per year',
              credits: '480',
              careerPaths: ['Agricultural Officer', 'Farm Manager', 'Agribusiness Entrepreneur'],
              intake: 'January'
            },
            {
              id: 'nul-dip-agriculture',
              name: 'Diploma in Agriculture',
              duration: '2 years',
              requirements: ['Biology C', 'Agriculture C', 'Mathematics D', 'English D'],
              description: 'Practical agriculture diploma program',
              fees: 'M20,000 per year',
              credits: '240',
              careerPaths: ['Agricultural Extension Officer', 'Farm Supervisor'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Law',
          courses: [
            {
              id: 'nul-llb',
              name: 'LLB Law',
              duration: '4 years',
              requirements: ['English B', 'History C', 'English Literature C', 'Any other two subjects C'],
              description: 'Bachelor of Laws program for legal practice',
              fees: 'M32,000 per year',
              credits: '480',
              careerPaths: ['Lawyer', 'Legal Advisor', 'Prosecutor', 'Corporate Counsel'],
              intake: 'January, August'
            }
          ]
        }
      ]
    },
    {
      id: 'limkokwing',
      name: 'Limkokwing University of Creative Technology',
      type: 'University',
      location: 'Maseru, Lesotho',
      email: 'info@limkokwing.ls',
      phone: '+26622317281',
      website: 'https://www.limkokwing.net/ls',
      status: 'approved',
      description: 'Innovative university specializing in creative technology and design',
      established: '2008',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Design Innovation',
          courses: [
            {
              id: 'luc-ba-graphic-design',
              name: 'BA Graphic Design',
              duration: '3 years',
              requirements: ['English C', 'Art C', 'Any three other subjects with D or better'],
              description: 'Graphic design and visual communication program',
              fees: 'M35,000 per year',
              credits: '360',
              careerPaths: ['Graphic Designer', 'Art Director', 'UI/UX Designer', 'Brand Manager'],
              intake: 'January, May, September'
            },
            {
              id: 'luc-ba-multimedia',
              name: 'BA Multimedia Design',
              duration: '3 years',
              requirements: ['English C', 'Art C', 'Computer Studies C', 'Two other subjects D'],
              description: 'Multimedia design including animation, video and web design',
              fees: 'M35,000 per year',
              credits: '360',
              careerPaths: ['Multimedia Designer', 'Animator', 'Video Editor', 'Web Designer'],
              intake: 'January, May, September'
            },
            {
              id: 'luc-ba-fashion',
              name: 'BA Fashion Design',
              duration: '3 years',
              requirements: ['English C', 'Art C', 'Design C', 'Two other subjects D'],
              description: 'Fashion design and merchandising program',
              fees: 'M38,000 per year',
              credits: '360',
              careerPaths: ['Fashion Designer', 'Fashion Buyer', 'Costume Designer', 'Fashion Stylist'],
              intake: 'January, September'
            }
          ]
        },
        {
          name: 'Faculty of Information & Communication Technology',
          courses: [
            {
              id: 'luc-bsc-it',
              name: 'BSc Information Technology',
              duration: '3 years',
              requirements: ['Mathematics C', 'English C', 'Computer Studies C', 'Two other subjects D'],
              description: 'Information technology systems and network administration',
              fees: 'M32,000 per year',
              credits: '360',
              careerPaths: ['IT Support', 'Network Administrator', 'Systems Analyst', 'IT Consultant'],
              intake: 'January, May, September'
            },
            {
              id: 'luc-bsc-software',
              name: 'BSc Software Engineering',
              duration: '4 years',
              requirements: ['Mathematics B', 'English C', 'Computer Studies C', 'Physics C'],
              description: 'Software development and engineering principles',
              fees: 'M35,000 per year',
              credits: '480',
              careerPaths: ['Software Engineer', 'App Developer', 'Software Architect', 'QA Engineer'],
              intake: 'January, September'
            },
            {
              id: 'luc-bsc-network',
              name: 'BSc Network Computing',
              duration: '3 years',
              requirements: ['Mathematics C', 'English C', 'Computer Studies C', 'Physics D'],
              description: 'Network infrastructure and cloud computing',
              fees: 'M33,000 per year',
              credits: '360',
              careerPaths: ['Network Engineer', 'Cloud Administrator', 'Security Specialist'],
              intake: 'January, May, September'
            }
          ]
        },
        {
          name: 'Faculty of Business & Globalisation',
          courses: [
            {
              id: 'luc-ba-business',
              name: 'BA Business Administration',
              duration: '3 years',
              requirements: ['English C', 'Mathematics D', 'Commerce C', 'Two other subjects D'],
              description: 'Business management and administration program',
              fees: 'M30,000 per year',
              credits: '360',
              careerPaths: ['Business Manager', 'Entrepreneur', 'Administrative Manager'],
              intake: 'January, May, September'
            },
            {
              id: 'luc-ba-marketing',
              name: 'BA Marketing',
              duration: '3 years',
              requirements: ['English C', 'Mathematics D', 'Commerce C', 'Two other subjects D'],
              description: 'Marketing strategies and brand management',
              fees: 'M30,000 per year',
              credits: '360',
              careerPaths: ['Marketing Manager', 'Brand Specialist', 'Digital Marketer', 'Sales Manager'],
              intake: 'January, May, September'
            },
            {
              id: 'luc-ba-tourism',
              name: 'BA Tourism Management',
              duration: '3 years',
              requirements: ['English C', 'Geography C', 'Two other subjects with D or better'],
              description: 'Tourism and hospitality management',
              fees: 'M28,000 per year',
              credits: '360',
              careerPaths: ['Tourism Officer', 'Hotel Manager', 'Travel Consultant', 'Event Planner'],
              intake: 'January, September'
            }
          ]
        }
      ]
    },
    {
      id: 'cas',
      name: 'Center for Accounting Studies (CAS)',
      type: 'College',
      location: 'Maseru, Lesotho',
      email: 'info@cas.ac.ls',
      phone: '+26622324121',
      website: 'https://www.cas.ac.ls',
      status: 'approved',
      description: 'Specialized institution for accounting and finance education',
      established: '1990',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Accounting',
          courses: [
            {
              id: 'cas-dip-accounting',
              name: 'Diploma in Accounting',
              duration: '2 years',
              requirements: ['Mathematics C', 'English C', 'Accounting C', 'Two other subjects D'],
              description: 'Comprehensive accounting diploma program',
              fees: 'M18,000 per year',
              credits: '240',
              careerPaths: ['Accounting Technician', 'Bookkeeper', 'Accounts Clerk'],
              intake: 'January, July'
            },
            {
              id: 'cas-adv-dip-accounting',
              name: 'Advanced Diploma in Accounting',
              duration: '1 year',
              requirements: ['Diploma in Accounting or equivalent L4 qualification'],
              description: 'Advanced accounting studies for professional development',
              fees: 'M20,000 per year',
              credits: '120',
              careerPaths: ['Assistant Accountant', 'Financial Analyst', 'Tax Consultant'],
              intake: 'January'
            },
            {
              id: 'cas-cert-accounting',
              name: 'Certificate in Accounting',
              duration: '1 year',
              requirements: ['Mathematics D', 'English D', 'Three other subjects with E or better'],
              description: 'Foundation certificate in accounting principles',
              fees: 'M15,000 per year',
              credits: '120',
              careerPaths: ['Accounts Assistant', 'Payroll Clerk', 'Inventory Clerk'],
              intake: 'January, July'
            },
            {
              id: 'cas-cert-computer',
              name: 'Certificate in Computer Applications',
              duration: '1 year',
              requirements: ['English D', 'Mathematics D', 'Computer Studies D'],
              description: 'Basic computer applications and office software',
              fees: 'M12,000 per year',
              credits: '120',
              careerPaths: ['Data Entry Clerk', 'Office Assistant', 'Computer Operator'],
              intake: 'January, July'
            }
          ]
        }
      ]
    },
    {
      id: 'lce',
      name: 'Lesotho College of Education (LCE)',
      type: 'College',
      location: 'Maseru, Lesotho',
      email: 'admissions@lce.ac.ls',
      phone: '+26622320421',
      website: 'https://www.lce.ac.ls',
      status: 'approved',
      description: 'Teacher training and education college',
      established: '1975',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Education',
          courses: [
            {
              id: 'lce-dip-primary',
              name: 'Diploma in Primary Education',
              duration: '3 years',
              requirements: ['English C', 'Mathematics D', 'Science D', 'Sesotho C', 'One other subject D'],
              description: 'Primary school teacher training program',
              fees: 'M16,000 per year',
              credits: '360',
              careerPaths: ['Primary School Teacher', 'Early Childhood Educator'],
              intake: 'January'
            },
            {
              id: 'lce-dip-secondary',
              name: 'Diploma in Secondary Education',
              duration: '3 years',
              requirements: ['English C', 'Mathematics D', 'Two teaching subjects at C', 'One other subject D'],
              description: 'Secondary school teacher training with subject specialization',
              fees: 'M16,000 per year',
              credits: '360',
              careerPaths: ['Secondary School Teacher', 'Subject Specialist'],
              intake: 'January'
            },
            {
              id: 'lce-cert-early',
              name: 'Certificate in Early Childhood Education',
              duration: '2 years',
              requirements: ['English D', 'Mathematics D', 'Three other subjects with E or better'],
              description: 'Early childhood development and education',
              fees: 'M12,000 per year',
              credits: '240',
              careerPaths: ['Early Childhood Teacher', 'Daycare Supervisor'],
              intake: 'January'
            },
            {
              id: 'lce-pgde',
              name: 'Postgraduate Diploma in Education',
              duration: '1 year',
              requirements: ['Bachelor Degree in any field', 'English C'],
              description: 'Postgraduate teaching qualification for degree holders',
              fees: 'M20,000 per year',
              credits: '120',
              careerPaths: ['Secondary School Teacher', 'Lecturer', 'Education Specialist'],
              intake: 'January'
            }
          ]
        }
      ]
    },
    {
      id: 'botho',
      name: 'Botho University Lesotho',
      type: 'University',
      location: 'Maseru, Lesotho',
      email: 'lesotho@bothouniversity.com',
      phone: '+26628382638',
      website: 'https://www.bothouniversity.com',
      status: 'approved',
      description: 'Private university offering business, computing and health programs',
      established: '2011',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Business & Accounting',
          courses: [
            {
              id: 'botho-bsc-accounting',
              name: 'BSc Accounting',
              duration: '4 years',
              requirements: ['Mathematics C', 'English C', 'Accounting C', 'Two other subjects D'],
              description: 'Professional accounting degree program',
              fees: 'M45,000 per year',
              credits: '480',
              careerPaths: ['Chartered Accountant', 'Auditor', 'Financial Controller', 'Tax Consultant'],
              intake: 'January, May, September'
            },
            {
              id: 'botho-bsc-business',
              name: 'BSc Business Management',
              duration: '4 years',
              requirements: ['Mathematics C', 'English C', 'Commerce C', 'Two other subjects D'],
              description: 'Business management and entrepreneurship program',
              fees: 'M42,000 per year',
              credits: '480',
              careerPaths: ['Business Manager', 'Entrepreneur', 'Operations Manager', 'Project Manager'],
              intake: 'January, May, September'
            },
            {
              id: 'botho-dip-business',
              name: 'Diploma in Business',
              duration: '2 years',
              requirements: ['Mathematics D', 'English D', 'Three other subjects with E or better'],
              description: 'Foundation business studies diploma',
              fees: 'M25,000 per year',
              credits: '240',
              careerPaths: ['Office Administrator', 'Sales Representative', 'Customer Service Agent'],
              intake: 'January, May, September'
            }
          ]
        },
        {
          name: 'Faculty of Computing',
          courses: [
            {
              id: 'botho-bsc-computing',
              name: 'BSc Computing',
              duration: '4 years',
              requirements: ['Mathematics C', 'English C', 'Computer Studies C', 'Two other subjects D'],
              description: 'Comprehensive computing and IT degree',
              fees: 'M48,000 per year',
              credits: '480',
              careerPaths: ['Software Developer', 'IT Manager', 'Systems Analyst', 'Database Administrator'],
              intake: 'January, May, September'
            },
            {
              id: 'botho-bsc-network',
              name: 'BSc Network Security',
              duration: '4 years',
              requirements: ['Mathematics C', 'English C', 'Computer Studies C', 'Physics D'],
              description: 'Network security and cybersecurity specialization',
              fees: 'M50,000 per year',
              credits: '480',
              careerPaths: ['Network Security Specialist', 'Cybersecurity Analyst', 'Information Security Officer'],
              intake: 'January, September'
            },
            {
              id: 'botho-dip-it',
              name: 'Diploma in IT',
              duration: '2 years',
              requirements: ['Mathematics D', 'English D', 'Computer Studies D', 'Two other subjects E'],
              description: 'Information technology support diploma',
              fees: 'M28,000 per year',
              credits: '240',
              careerPaths: ['IT Support Technician', 'Help Desk Analyst', 'Computer Technician'],
              intake: 'January, May, September'
            }
          ]
        },
        {
          name: 'Faculty of Health',
          courses: [
            {
              id: 'botho-bsc-public-health',
              name: 'BSc Public Health',
              duration: '4 years',
              requirements: ['Biology C', 'Chemistry C', 'Mathematics D', 'English C'],
              description: 'Public health sciences and community health',
              fees: 'M40,000 per year',
              credits: '480',
              careerPaths: ['Public Health Officer', 'Health Educator', 'Community Health Worker'],
              intake: 'January, September'
            },
            {
              id: 'botho-dip-public-health',
              name: 'Diploma in Public Health',
              duration: '2 years',
              requirements: ['Biology D', 'Science D', 'English D', 'Mathematics E'],
              description: 'Public health and hygiene diploma',
              fees: 'M30,000 per year',
              credits: '240',
              careerPaths: ['Health Assistant', 'Community Health Worker', 'Health Promoter'],
              intake: 'January, September'
            }
          ]
        }
      ]
    },
    {
      id: 'nhtc',
      name: 'National Health Training College (NHTC)',
      type: 'College',
      location: 'Maseru, Lesotho',
      email: 'info@nhtc.ls',
      phone: '+26622320431',
      website: 'https://www.nhtc.ls',
      status: 'approved',
      description: 'Health sciences and nursing training institution',
      established: '1978',
      accreditation: 'Lesotho Nursing Council',
      faculties: [
        {
          name: 'Faculty of Health Sciences',
          courses: [
            {
              id: 'nhtc-dip-nursing',
              name: 'Diploma in General Nursing',
              duration: '3 years',
              requirements: ['Biology C', 'Chemistry C', 'English C', 'Mathematics D', 'Physics D'],
              description: 'Comprehensive nursing diploma program',
              fees: 'M20,000 per year',
              credits: '360',
              careerPaths: ['Registered Nurse', 'Clinical Nurse', 'Nurse Educator'],
              intake: 'January'
            },
            {
              id: 'nhtc-dip-midwifery',
              name: 'Diploma in Midwifery',
              duration: '1 year',
              requirements: ['Diploma in Nursing or equivalent', 'Current nursing registration'],
              description: 'Specialized midwifery training program',
              fees: 'M18,000 per year',
              credits: '120',
              careerPaths: ['Midwife', 'Maternal Health Specialist', 'Reproductive Health Nurse'],
              intake: 'January'
            },
            {
              id: 'nhtc-dip-psychiatry',
              name: 'Diploma in Psychiatry',
              duration: '1 year',
              requirements: ['Diploma in Nursing', 'Current nursing registration', '2 years experience'],
              description: 'Psychiatric nursing specialization',
              fees: 'M22,000 per year',
              credits: '120',
              careerPaths: ['Psychiatric Nurse', 'Mental Health Nurse', 'Substance Abuse Counselor'],
              intake: 'January'
            },
            {
              id: 'nhtc-cert-nursing',
              name: 'Certificate in Nursing Assistance',
              duration: '2 years',
              requirements: ['English D', 'Science D', 'Mathematics E', 'Two other subjects E'],
              description: 'Nursing assistant and patient care training',
              fees: 'M15,000 per year',
              credits: '240',
              careerPaths: ['Nursing Assistant', 'Patient Care Assistant', 'Home Based Carer'],
              intake: 'January'
            }
          ]
        }
      ]
    },
    {
      id: 'lac',
      name: 'Lesotho Agricultural College (LAC)',
      type: 'College',
      location: 'Maseru, Lesotho',
      email: 'principal@lac.ac.ls',
      phone: '+26622320125',
      website: 'https://www.lac.ac.ls',
      status: 'approved',
      description: 'Agricultural sciences and farming education institution',
      established: '1955',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Agriculture',
          courses: [
            {
              id: 'lac-dip-agriculture',
              name: 'Diploma in General Agriculture',
              duration: '3 years',
              requirements: ['Biology C', 'Chemistry D', 'Mathematics D', 'English D', 'Agriculture C'],
              description: 'Comprehensive agricultural sciences diploma',
              fees: 'M15,000 per year',
              credits: '360',
              careerPaths: ['Agricultural Officer', 'Farm Manager', 'Crop Specialist', 'Livestock Manager'],
              intake: 'January'
            },
            {
              id: 'lac-dip-agri-education',
              name: 'Diploma in Agricultural Education',
              duration: '3 years',
              requirements: ['Biology C', 'English C', 'Mathematics D', 'Agriculture C'],
              description: 'Agricultural education and extension services',
              fees: 'M15,000 per year',
              credits: '360',
              careerPaths: ['Agricultural Teacher', 'Extension Officer', 'Farm Instructor'],
              intake: 'January'
            },
            {
              id: 'lac-cert-agriculture',
              name: 'Certificate in Agriculture',
              duration: '2 years',
              requirements: ['Science D', 'English D', 'Mathematics E', 'Two other subjects E'],
              description: 'Basic agriculture and farming skills',
              fees: 'M12,000 per year',
              credits: '240',
              careerPaths: ['Farm Assistant', 'Agricultural Technician', 'Nursery Attendant'],
              intake: 'January'
            },
            {
              id: 'lac-cert-animal-health',
              name: 'Certificate in Animal Health',
              duration: '2 years',
              requirements: ['Biology D', 'Science D', 'English D', 'Mathematics E'],
              description: 'Animal health and veterinary assistance',
              fees: 'M13,000 per year',
              credits: '240',
              careerPaths: ['Animal Health Assistant', 'Veterinary Aid', 'Livestock Health Worker'],
              intake: 'January'
            }
          ]
        }
      ]
    },
    {
      id: 'lerotholi',
      name: 'Lerotholi Polytechnic (LP)',
      type: 'Polytechnic',
      location: 'Maseru, Lesotho',
      email: 'info@lerotholipoly.ac.ls',
      phone: '+26622320451',
      website: 'https://www.lerotholipoly.ac.ls',
      status: 'approved',
      description: 'Technical and vocational training institution',
      established: '1905',
      accreditation: 'Lesotho Council on Higher Education',
      faculties: [
        {
          name: 'Faculty of Engineering',
          courses: [
            {
              id: 'lp-dip-civil',
              name: 'Diploma in Civil Engineering',
              duration: '3 years',
              requirements: ['Mathematics C', 'Physics C', 'English C', 'Technical Drawing C'],
              description: 'Civil engineering technology and construction',
              fees: 'M22,000 per year',
              credits: '360',
              careerPaths: ['Civil Engineering Technician', 'Site Supervisor', 'Construction Manager'],
              intake: 'January'
            },
            {
              id: 'lp-dip-electrical',
              name: 'Diploma in Electrical Engineering',
              duration: '3 years',
              requirements: ['Mathematics C', 'Physics C', 'English C', 'Technical Drawing C'],
              description: 'Electrical systems and power engineering',
              fees: 'M22,000 per year',
              credits: '360',
              careerPaths: ['Electrical Technician', 'Maintenance Electrician', 'Power Systems Operator'],
              intake: 'January'
            },
            {
              id: 'lp-dip-mechanical',
              name: 'Diploma in Mechanical Engineering',
              duration: '3 years',
              requirements: ['Mathematics C', 'Physics C', 'English C', 'Technical Drawing C'],
              description: 'Mechanical systems and manufacturing technology',
              fees: 'M22,000 per year',
              credits: '360',
              careerPaths: ['Mechanical Technician', 'Maintenance Fitter', 'Production Supervisor'],
              intake: 'January'
            }
          ]
        },
        {
          name: 'Faculty of Business Studies',
          courses: [
            {
              id: 'lp-dip-business',
              name: 'Diploma in Business Management',
              duration: '2 years',
              requirements: ['English C', 'Mathematics D', 'Commerce C', 'Two other subjects D'],
              description: 'Business administration and management',
              fees: 'M16,000 per year',
              credits: '240',
              careerPaths: ['Office Manager', 'Administrative Officer', 'Small Business Owner'],
              intake: 'January, July'
            },
            {
              id: 'lp-dip-secretarial',
              name: 'Diploma in Secretarial Studies',
              duration: '2 years',
              requirements: ['English C', 'Office Practice C', 'Two other subjects with D or better'],
              description: 'Secretarial and office administration',
              fees: 'M14,000 per year',
              credits: '240',
              careerPaths: ['Executive Secretary', 'Office Administrator', 'Personal Assistant'],
              intake: 'January, July'
            },
            {
              id: 'lp-cert-entrepreneurship',
              name: 'Certificate in Entrepreneurship',
              duration: '1 year',
              requirements: ['English D', 'Mathematics D', 'Three other subjects with E or better'],
              description: 'Entrepreneurship and small business management',
              fees: 'M12,000 per year',
              credits: '120',
              careerPaths: ['Small Business Owner', 'Entrepreneur', 'Business Developer'],
              intake: 'January, July'
            }
          ]
        },
        {
          name: 'Faculty of Hotel & Catering',
          courses: [
            {
              id: 'lp-dip-hotel',
              name: 'Diploma in Hotel Management',
              duration: '2 years',
              requirements: ['English C', 'Mathematics D', 'Home Economics C', 'Two other subjects D'],
              description: 'Hotel and hospitality management',
              fees: 'M18,000 per year',
              credits: '240',
              careerPaths: ['Hotel Manager', 'Front Office Manager', 'Hospitality Supervisor'],
              intake: 'January, July'
            },
            {
              id: 'lp-cert-food',
              name: 'Certificate in Food Production',
              duration: '1 year',
              requirements: ['English D', 'Home Economics D', 'Three other subjects with E or better'],
              description: 'Food preparation and culinary arts',
              fees: 'M10,000 per year',
              credits: '120',
              careerPaths: ['Cook', 'Kitchen Assistant', 'Food Service Worker'],
              intake: 'January, July'
            }
          ]
        }
      ]
    }
  ];

  console.log('📚 Adding institutions and courses...');
  
  for (const institution of institutions) {
    try {
      // Add institution
      await db.collection('institutions').doc(institution.id).set({
        name: institution.name,
        type: institution.type,
        location: institution.location,
        email: institution.email,
        phone: institution.phone,
        website: institution.website,
        status: institution.status,
        description: institution.description,
        established: institution.established,
        accreditation: institution.accreditation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Add courses to separate collection for easier querying
      for (const faculty of institution.faculties) {
        for (const course of faculty.courses) {
          await db.collection('courses').doc(course.id).set({
            ...course,
            institutionId: institution.id,
            institutionName: institution.name,
            faculty: faculty.name,
            createdAt: new Date().toISOString(),
            status: 'active'
          });
        }
      }
      
      console.log(`✅ Added ${institution.name} with ${institution.faculties.reduce((acc, fac) => acc + fac.courses.length, 0)} courses`);
      
    } catch (error) {
      console.error(`❌ Error adding ${institution.name}:`, error);
    }
  }
  
  console.log(`🎉 Added ${institutions.length} institutions with all courses!`);
};

const createAdminUser = async () => {
  const adminUser = {
    id: 'admin',
    email: 'admin@careerbridge.ls',
    role: 'admin',
    fullName: 'System Administrator',
    phone: '+26650000000',
    status: 'active',
    createdAt: new Date().toISOString(),
    permissions: ['manage_users', 'manage_institutions', 'manage_companies', 'view_reports']
  };

  try {
    await db.collection('users').doc(adminUser.id).set(adminUser);
    console.log('✅ Created admin user');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

const populateCompaniesAndJobs = async () => {
  const companies = [
    {
      id: 'standard-bank',
      name: 'Standard Bank Lesotho',
      type: 'Banking',
      industry: 'Financial Services',
      email: 'careers@standardbank.ls',
      phone: '+26622310000',
      website: 'https://www.standardbank.co.ls',
      location: 'Maseru, Lesotho',
      description: 'Leading financial services provider in Lesotho',
      status: 'approved',
      contactPerson: 'HR Department',
      size: '500-1000 employees'
    },
    {
      id: 'vodacom',
      name: 'Vodacom Lesotho',
      type: 'Telecommunications',
      industry: 'Telecom',
      email: 'recruitment@vodacom.co.ls',
      phone: '+26622320000',
      website: 'https://www.vodacom.co.ls',
      location: 'Maseru, Lesotho',
      description: 'Leading telecommunications company in Lesotho',
      status: 'approved',
      contactPerson: 'Talent Acquisition',
      size: '300-500 employees'
    },
    {
      id: 'ministry-health',
      name: 'Ministry of Health',
      type: 'Government',
      industry: 'Public Health',
      email: 'hr@health.gov.ls',
      phone: '+26622320111',
      website: 'https://www.health.gov.ls',
      location: 'Maseru, Lesotho',
      description: 'Government ministry responsible for health services',
      status: 'approved',
      contactPerson: 'Human Resources',
      size: '1000+ employees'
    },
    {
      id: 'letseng-diamonds',
      name: 'Letseng Diamonds',
      type: 'Mining',
      industry: 'Mining',
      email: 'hr@letseng.co.ls',
      phone: '+26622450000',
      website: 'https://www.letsengdiamonds.co.ls',
      location: 'Letseng, Lesotho',
      description: 'World-renowned diamond mining company',
      status: 'approved',
      contactPerson: 'HR Manager',
      size: '500-1000 employees'
    }
  ];

  const jobs = [
    {
      id: 'sb-it-officer',
      title: 'IT Support Officer',
      companyId: 'standard-bank',
      companyName: 'Standard Bank Lesotho',
      location: 'Maseru',
      salary: 'M15,000 - M20,000',
      type: 'Full-time',
      description: 'Provide technical support for banking systems and infrastructure.',
      requirements: [
        'BSc Computer Science or IT Diploma',
        '2 years IT support experience',
        'Knowledge of network protocols',
        'Troubleshooting skills'
      ],
      qualifications: [
        'IT certification (e.g., CCNA, CompTIA)',
        'Banking systems knowledge'
      ],
      status: 'active',
      postedDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'vodacom-graduate',
      title: 'Graduate Trainee Program',
      companyId: 'vodacom',
      companyName: 'Vodacom Lesotho',
      location: 'Maseru',
      salary: 'M12,000 - M15,000',
      type: 'Full-time',
      description: 'One-year graduate development program in telecommunications.',
      requirements: [
        'Bachelor degree in any field',
        'Graduated within last 2 years',
        'Strong academic record',
        'Leadership potential'
      ],
      qualifications: [
        'Computer literacy',
        'Good communication skills'
      ],
      status: 'active',
      postedDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'moh-nurse',
      title: 'Registered Nurse',
      companyId: 'ministry-health',
      companyName: 'Ministry of Health',
      location: 'Various Districts',
      salary: 'M10,000 - M14,000',
      type: 'Full-time',
      description: 'Provide nursing care in public health facilities.',
      requirements: [
        'Diploma in General Nursing',
        'Registered with Nursing Council',
        '2 years clinical experience',
        'Valid practicing license'
      ],
      qualifications: [
        'Midwifery qualification',
        'Primary health care experience'
      ],
      status: 'active',
      postedDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'letseng-geologist',
      title: 'Junior Geologist',
      companyId: 'letseng-diamonds',
      companyName: 'Letseng Diamonds',
      location: 'Letseng Mine',
      salary: 'M18,000 - M25,000',
      type: 'Full-time',
      description: 'Geological mapping and mineral exploration.',
      requirements: [
        'BSc Geology or Earth Sciences',
        'Knowledge of GIS software',
        'Field work experience',
        'Valid drivers license'
      ],
      qualifications: [
        'Masters degree in Geology',
        'Mining industry experience'
      ],
      status: 'active',
      postedDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  console.log('💼 Adding companies and jobs...');

  for (const company of companies) {
    try {
      await db.collection('companies').doc(company.id).set({
        ...company,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Error adding company ${company.name}:`, error);
    }
  }

  for (const job of jobs) {
    try {
      await db.collection('jobs').doc(job.id).set({
        ...job,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Error adding job ${job.title}:`, error);
    }
  }

  console.log(`✅ Added ${companies.length} companies and ${jobs.length} jobs`);
};

// Run the population script
populateDatabase().then(() => {
  console.log('🚀 Database is now fully populated and ready!');
  console.log('📊 Collections created: institutions, courses, users, companies, jobs');
  process.exit(0);
}).catch(error => {
  console.error('💥 Database population failed:', error);
  process.exit(1);
});