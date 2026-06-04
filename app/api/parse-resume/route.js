import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request) {
  try {
    const { fileData } = await request.json();
    const buffer = Buffer.from(fileData, 'base64');
    const data = await pdf(buffer);
    const text = data.text;
    
    // Extract skills via keyword matching — comprehensive list
    const techKeywords = [
      // Languages
      'JavaScript','TypeScript','Python','Java','C++','C#','C','Go','Golang','Rust','Ruby','PHP','Swift','Kotlin','Scala','R','MATLAB','Perl','Haskell','Lua','Dart','Objective-C','Assembly','Bash','Shell','PowerShell',
      // Web Frontend
      'React','Angular','Vue','Vue.js','Svelte','Next.js','Nuxt.js','Gatsby','jQuery','Bootstrap','Tailwind','Tailwind CSS','Material UI','MUI','Chakra UI','Sass','SCSS','Less','HTML','CSS','WebSocket','Redux','Zustand','Recoil',
      // Web Backend
      'Node.js','Express','Express.js','Django','Flask','FastAPI','Spring','Spring Boot','ASP.NET','.NET','Rails','Ruby on Rails','Laravel','Gin','Fiber','NestJS','Hono','Koa',
      // Mobile
      'React Native','Flutter','SwiftUI','Jetpack Compose','Android','iOS','Xamarin','Ionic',
      // Databases
      'MongoDB','PostgreSQL','MySQL','SQLite','Redis','Cassandra','DynamoDB','CouchDB','MariaDB','Oracle','SQL Server','MSSQL','Neo4j','InfluxDB','Supabase','PlanetScale','Firestore',
      // Cloud & DevOps
      'AWS','Azure','GCP','Google Cloud','Docker','Kubernetes','K8s','Terraform','Ansible','Jenkins','GitHub Actions','GitLab CI','CircleCI','Travis CI','Heroku','Vercel','Netlify','DigitalOcean','Cloudflare','Lambda','EC2','S3','ECS','EKS','CloudFormation','Pulumi',
      // Data & ML/AI
      'TensorFlow','PyTorch','Keras','Scikit-learn','Sklearn','Pandas','NumPy','SciPy','Matplotlib','Seaborn','Plotly','OpenCV','NLTK','SpaCy','Hugging Face','Transformers','LLM','GPT','BERT','LangChain','RAG','Stable Diffusion','Computer Vision','NLP','Natural Language Processing','Deep Learning','Machine Learning','Artificial Intelligence','AI','ML','Neural Networks','CNN','RNN','LSTM','GAN','Reinforcement Learning','XGBoost','LightGBM','CatBoost','Random Forest','Decision Tree','Regression','Classification','Clustering',
      // Data Engineering
      'Apache Spark','Spark','Hadoop','Hive','Airflow','Kafka','RabbitMQ','Flink','Beam','dbt','Snowflake','BigQuery','Redshift','Data Pipeline','ETL','Data Warehouse','Data Lake',
      // APIs & Protocols
      'GraphQL','REST','RESTful','gRPC','WebSocket','SOAP','OAuth','JWT','API',
      // Tools & Platforms
      'Git','GitHub','GitLab','Bitbucket','Linux','Unix','Windows','macOS','Nginx','Apache','Figma','Jira','Confluence','Notion','Slack','Postman','Swagger','VS Code','IntelliJ','Eclipse','Vim',
      // Testing
      'Jest','Mocha','Chai','Cypress','Selenium','Playwright','JUnit','pytest','Unittest','Testing','TDD','BDD',
      // Concepts
      'Microservices','Monolith','Serverless','CI/CD','DevOps','Agile','Scrum','Kanban','OOP','Object-Oriented','Functional Programming','Design Patterns','SOLID','MVC','MVVM','System Design','Data Structures','Algorithms','DSA','Operating Systems','OS','Computer Networks','DBMS','Database Management','Distributed Systems','Cloud Computing','Cybersecurity','Blockchain','Web3','IoT',
      // Data Visualization & BI
      'Tableau','Power BI','Looker','D3.js','Chart.js','Grafana',
      // Others
      'Elasticsearch','ELK','Prometheus','Grafana','New Relic','Datadog','Sentry','Firebase','Auth0','Stripe','Twilio','SendGrid','Celery','Gunicorn','Uvicorn','PM2',
      // Certifications keywords
      'AWS Certified','Azure Certified','Google Certified','Cisco','CompTIA','PMP','Scrum Master','TOGAF',
      // Misc
      'SQL','NoSQL','JSON','XML','YAML','Markdown','LaTeX','Jupyter','Colab','Anaconda','Conda','pip','npm','yarn','pnpm','Maven','Gradle','Webpack','Vite','Rollup','Parcel','Babel','ESLint','Prettier'
    ];
    
    const textLower = text.toLowerCase();
    
    if (!text.trim()) {
      return NextResponse.json({ error: 'This PDF contains no readable text. It might be an image or a flattened PDF. Please upload a standard text-based PDF.' }, { status: 400 });
    }

    const foundSkills = techKeywords.filter(k => {
      // Escape special characters for regex, handle cases like C++ or C#
      const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundaries. For C++ or .NET, \b doesn't work perfectly on symbols, 
      // so we use a non-word character boundary check
      const regex = new RegExp(`(?:^|\\W)${escapedKey}(?:$|\\W)`, 'i');
      return regex.test(text);
    });
    
    // Deduplicate (case-insensitive)
    const seen = new Set();
    const uniqueSkills = foundSkills.filter(s => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Estimate experience
    const yearMatches = text.match(/20\d{2}/g) || [];
    const years = yearMatches.map(Number);
    const expYears = years.length >= 2 ? Math.max(...years) - Math.min(...years) : 0;
    
    console.log(`[PARSE-RESUME] Extracted ${text.length} chars from PDF.`);
    console.log(`[PARSE-RESUME] Found ${uniqueSkills.length} skills:`, uniqueSkills);
    
    return NextResponse.json({ text, skills: uniqueSkills, experienceYears: expYears });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse PDF: ' + error.message }, { status: 500 });
  }
}

