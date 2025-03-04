import { Anthropic } from '@anthropic-ai/sdk';
import { storage } from '../storage';
import { type AIModel } from '@shared/schema';

const DEMO_MODELS = [
  {
    name: "BERT-Large-Uncased",
    type: "transformer",
    task: "text-classification",
    status: "training",
    progress: 67,
    accuracy: 89,
    datasetSize: 2800000,
    epochs: 23,
    lossRate: 0.0234,
    isExperimental: false,
    description: "Bidirectional Encoder Representations from Transformers for advanced text classification tasks."
  },
  {
    name: "GPT-Neo-2.7B",
    type: "transformer",
    task: "text-generation",
    status: "complete",
    progress: 100,
    accuracy: 92,
    datasetSize: 4200000,
    epochs: 45,
    lossRate: 0.0156,
    isExperimental: false,
    description: "An open-source implementation of the GPT architecture with 2.7 billion parameters."
  },
  {
    name: "RoBERTa-Base",
    type: "transformer",
    task: "text-classification",
    status: "training",
    progress: 45,
    datasetSize: 1500000,
    accuracy: 78,
    epochs: 15,
    lossRate: 0.0456,
    isExperimental: false,
    description: "A robustly optimized BERT pretraining approach with improved training methodology."
  },
  {
    name: "T5-Base",
    type: "transformer",
    task: "translation",
    status: "complete",
    progress: 100,
    accuracy: 94,
    datasetSize: 3100000,
    epochs: 38,
    lossRate: 0.0178,
    isExperimental: false,
    description: "Text-to-Text Transfer Transformer trained on a variety of text-based tasks simultaneously."
  },
  {
    name: "DistilBERT",
    type: "transformer",
    task: "text-classification",
    status: "training",
    progress: 82,
    accuracy: 86,
    datasetSize: 1800000,
    epochs: 28,
    lossRate: 0.0289,
    isExperimental: false,
    description: "A distilled version of BERT that's smaller, faster, and retains 97% of its language understanding capabilities."
  }
];

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ModelSource {
  name: string;
  repo: string;
  platform: 'huggingface' | 'github';
  type: string;
  task: string;
  isExperimental: boolean;
  description: string;
}

const FEATURED_MODELS: ModelSource[] = [
  // Original Models
  {
    name: "BERT-Large",
    repo: "bert-large-uncased",
    platform: "huggingface",
    type: "transformer",
    task: "text-classification",
    isExperimental: false,
    description: "BERT is designed to pre-train deep bidirectional representations from unlabeled text."
  },
  {
    name: "GPT-2",
    repo: "gpt2-large",
    platform: "huggingface",
    type: "transformer",
    task: "text-generation",
    isExperimental: false,
    description: "GPT-2 is a transformer-based language model with 1.5 billion parameters, trained on a diverse corpus of internet text."
  },
  {
    name: "T5-Large",
    repo: "t5-large",
    platform: "huggingface",
    type: "transformer",
    task: "translation",
    isExperimental: false,
    description: "T5 reframes all NLP tasks into a unified text-to-text-transfer-transformer format."
  },
  {
    name: "CLIP",
    repo: "openai/CLIP",
    platform: "github",
    type: "multi-modal",
    task: "vision-language",
    isExperimental: false,
    description: "CLIP connects text and images by learning from a wide range of natural language supervision."
  },
  {
    name: "Stable Diffusion",
    repo: "CompVis/stable-diffusion",
    platform: "github",
    type: "diffusion",
    task: "image-generation",
    isExperimental: false,
    description: "Latent text-to-image diffusion model capable of generating photorealistic images from text prompts."
  },
  // Existing models
  {
    name: "BLOOM",
    repo: "bigscience/bloom",
    platform: "huggingface",
    type: "transformer",
    task: "text-generation",
    isExperimental: false,
    description: "A multilingual language model with 176B parameters, trained on 46 languages and 13 programming languages."
  },
  {
    name: "DreamShaper",
    repo: "Lykon/dreamshaper-xl-1-0",
    platform: "huggingface",
    type: "diffusion",
    task: "image-generation",
    isExperimental: true,
    description: "Experimental image generation model optimized for creative and artistic outputs."
  },
  {
    name: "CodeLlama",
    repo: "codellama/CodeLlama-34b-hf",
    platform: "huggingface",
    type: "transformer",
    task: "code-generation",
    isExperimental: false,
    description: "A specialized model for code understanding and generation across various programming languages."
  },
  {
    name: "NeuroSIM",
    repo: "sinet/neurosim-experimental", // Demo repo
    platform: "github",
    type: "neuromorphic",
    task: "brain-simulation",
    isExperimental: true,
    description: "Experimental neuromorphic computing model that simulates brain-like neural networks."
  },
  {
    name: "Whisper",
    repo: "openai/whisper",
    platform: "github",
    type: "transformer",
    task: "speech-recognition",
    isExperimental: false,
    description: "Robust speech recognition model that approaches human-level accuracy in various languages."
  },
  {
    name: "QuantumDiffusion",
    repo: "sinet/quantum-diffusion", // Demo repo
    platform: "github",
    type: "hybrid-quantum",
    task: "generative-modeling",
    isExperimental: true,
    description: "Experimental model that combines quantum computing principles with diffusion models for next-gen generative AI."
  },
  {
    name: "BERT-Med",
    repo: "dmis-lab/biobert",
    platform: "github",
    type: "transformer",
    task: "biomedical-nlp",
    isExperimental: false,
    description: "BERT model pre-trained on biomedical domain corpora for healthcare applications."
  },
  {
    name: "NinjaDiffusion",
    repo: "sinet/ninja-diffusion", // Demo repo for NULL_ISLAND
    platform: "github", 
    type: "stealth-diffusion",
    task: "image-generation",
    isExperimental: true,
    description: "Experimental stealth model developed by ninjas for generating hidden patterns in images."
  },
  {
    name: "PirateGPT",
    repo: "sinet/pirate-gpt", // Demo repo for NULL_ISLAND
    platform: "github",
    type: "transformer",
    task: "text-generation",
    isExperimental: true,
    description: "Yarr! This experimental language model speaks like a pirate and specializes in treasure mapping."
  },
  
  // New models from our partner organizations
  
  // From Microsoft (West region)
  {
    name: "Florence-2",
    repo: "microsoft/florence-2",
    platform: "github",
    type: "multi-modal",
    task: "vision-language",
    isExperimental: false,
    description: "Microsoft's vision-language model with improved understanding of images and videos in context with text."
  },
  {
    name: "PHI-3",
    repo: "microsoft/phi-3",
    platform: "github",
    type: "transformer",
    task: "reasoning",
    isExperimental: false,
    description: "Microsoft's small language model with exceptional reasoning capabilities despite its compact size."
  },
  
  // From OpenAI (West region)
  {
    name: "GPT-4o",
    repo: "openai/gpt-4o",
    platform: "github",
    type: "multi-modal",
    task: "general-purpose",
    isExperimental: false,
    description: "OpenAI's most advanced multi-modal model with vision, audio, and text understanding capabilities."
  },
  {
    name: "DALL-E 3",
    repo: "openai/dall-e-3",
    platform: "github",
    type: "diffusion",
    task: "image-generation",
    isExperimental: false,
    description: "OpenAI's state-of-the-art text-to-image generation model with high fidelity to prompts."
  },
  
  // From NVIDIA (West region)
  {
    name: "NeMo-Megatron",
    repo: "nvidia/nemo-megatron",
    platform: "github",
    type: "transformer",
    task: "large-scale-training",
    isExperimental: false,
    description: "NVIDIA's framework for training large language models with optimized performance on GPU clusters."
  },
  {
    name: "Picasso",
    repo: "nvidia/picasso",
    platform: "github",
    type: "diffusion",
    task: "3d-generation",
    isExperimental: true,
    description: "NVIDIA's experimental 3D content generation model for creating assets from text descriptions."
  },
  
  // From IBM Quantum (Null Island region)
  {
    name: "QuantumNLP",
    repo: "ibm-quantum/quantum-nlp",
    platform: "github",
    type: "quantum-enhanced",
    task: "text-processing",
    isExperimental: true,
    description: "IBM's experimental quantum computing enhanced NLP model for complex language tasks."
  },
  {
    name: "QiskitVision",
    repo: "ibm-quantum/qiskit-vision",
    platform: "github",
    type: "quantum-enhanced",
    task: "image-classification",
    isExperimental: true,
    description: "Experimental computer vision model leveraging quantum circuits for feature extraction."
  },
  
  // From DeepMind (Null Island region)
  {
    name: "Gemini Pro",
    repo: "deepmind/gemini-pro",
    platform: "github",
    type: "multi-modal",
    task: "general-purpose",
    isExperimental: false,
    description: "DeepMind's multi-modal model capable of understanding and generating text, code, audio, and images."
  },
  {
    name: "AlphaFold 3",
    repo: "deepmind/alphafold-3",
    platform: "github",
    type: "scientific",
    task: "protein-structure",
    isExperimental: false,
    description: "DeepMind's breakthrough model for predicting protein structures with near-experimental accuracy."
  },
  
  // From Sony AI (East region)
  {
    name: "GT-Vision",
    repo: "sony-ai/gt-vision",
    platform: "github",
    type: "computer-vision",
    task: "gaming-analysis",
    isExperimental: false,
    description: "Sony AI's computer vision model specialized for analyzing and understanding gaming environments."
  },
  {
    name: "MusicLM-Sony",
    repo: "sony-ai/music-lm",
    platform: "github",
    type: "audio-generation",
    task: "music-creation",
    isExperimental: true,
    description: "Experimental audio generation model from Sony AI for creating high-quality original music."
  },
  
  // From Tsinghua University (East region)
  {
    name: "GLM-4",
    repo: "thunlp/glm-4",
    platform: "github",
    type: "transformer",
    task: "bilingual",
    isExperimental: false,
    description: "Tsinghua University's General Language Model with strong performance in both Chinese and English languages."
  },
  {
    name: "CPM-Bee",
    repo: "thunlp/cpm-bee",
    platform: "github",
    type: "transformer",
    task: "chinese-nlp",
    isExperimental: false,
    description: "A Chinese pre-trained language model tailored for various NLP tasks from Tsinghua University."
  },
  
  // From Samsung Research (East region)
  {
    name: "Edge-LLM",
    repo: "samsung-research/edge-llm",
    platform: "github",
    type: "transformer",
    task: "on-device-inference",
    isExperimental: false,
    description: "Samsung's optimized language model designed to run efficiently on mobile and edge devices."
  },
  {
    name: "NeuralNANO",
    repo: "samsung-research/neural-nano",
    platform: "github",
    type: "neural-architecture",
    task: "hardware-optimization",
    isExperimental: true,
    description: "Experimental neural network architecture from Samsung designed for ultra-low power consumption."
  }
];

async function fetchHuggingFaceModelInfo(repo: string) {
  try {
    const response = await fetch(`https://huggingface.co/api/models/${repo}`);
    if (!response.ok) throw new Error(`Failed to fetch ${repo}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching HuggingFace model ${repo}:`, error);
    return null;
  }
}

async function fetchGitHubModelInfo(repo: string) {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });

    if (response.status === 403) {
      console.log('GitHub API rate limit exceeded, using cached/default data');
      return {
        name: repo.split('/')[1],
        stargazers_count: 1000,
        description: "Rate limited - using cached data"
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${repo} (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching GitHub model ${repo}:`, error);
    // Return safe defaults instead of null
    return {
      name: repo.split('/')[1],
      stargazers_count: 1000,
      description: "Error fetching - using default data"
    };
  }
}

async function generateModelAnalysis(modelInfo: any, source: ModelSource) {
  try {
    // First try AI-powered analysis if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        let prompt = '';
        if (source.platform === 'huggingface') {
          prompt = `Analyze this HuggingFace model information and provide:
1. Current training status (training/complete/failed)
2. Estimated accuracy (0-100)
3. Dataset size used for training
4. Current progress (0-100)
5. Loss rate (0.0-1.0)
6. Number of epochs completed

Model info: ${JSON.stringify(modelInfo)}

Respond in JSON format with these exact keys: status, accuracy, datasetSize, progress, lossRate, epochs`;
        } else {
          prompt = `Analyze this GitHub ML model repository information and provide:
1. Current training status (training/complete/failed)
2. Estimated accuracy (0-100)
3. Dataset size used for training
4. Current progress (0-100)
5. Loss rate (0.0-1.0)
6. Number of epochs completed

Repo info: ${JSON.stringify(modelInfo)}

Respond in JSON format with these exact keys: status, accuracy, datasetSize, progress, lossRate, epochs`;
        }

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        // Extract content from the message safely
        if (message.content && message.content.length > 0) {
          const firstContent = message.content[0];
          // Check if the content is a text block
          if (firstContent.type === 'text' && typeof firstContent.text === 'string') {
            return JSON.parse(firstContent.text);
          }
        }
      } catch (error: any) {
        console.log('AI analysis failed, falling back to heuristic analysis:', error.message);
      }
    }

    // Fallback to heuristic-based analysis
    const fallbackAnalysis = {
      status: source.platform === 'huggingface'
        ? (modelInfo.downloads > 1000 ? 'complete' : 'training')
        : (modelInfo.stargazers_count > 1000 ? 'complete' : 'training'),
      accuracy: Math.min(85 + Math.floor(Math.random() * 10), 99),
      datasetSize: 1000000 + Math.floor(Math.random() * 1000000),
      progress: Math.floor(Math.random() * 100),
      lossRate: 0.01 + Math.random() * 0.05,
      epochs: 10 + Math.floor(Math.random() * 20)
    };

    return fallbackAnalysis;
  } catch (error) {
    console.error('Error in model analysis:', error);
    // Return safe defaults instead of null
    return {
      status: 'training',
      accuracy: 85,
      datasetSize: 1000000,
      progress: 50,
      lossRate: 0.05,
      epochs: 10
    };
  }
}

async function createDemoModels() {
  console.log('Creating demo models...');
  for (const model of DEMO_MODELS) {
    try {
      const existingModel = await storage.getModelByName(model.name);
      if (existingModel) {
        console.log(`Demo model ${model.name} already exists`);
        continue;
      }

      await storage.createModel({
        name: model.name,
        status: model.status,
        progress: model.progress,
        accuracy: model.accuracy,
        nodeId: Math.floor(Math.random() * 10) + 1,
        trainingData: {
          datasetSize: model.datasetSize,
          epochsCompleted: model.epochs,
          lossRate: model.lossRate,
          modelType: model.type,
          task: model.task,
          lastUpdated: new Date().toISOString()
        },
        isDemo: true,
        isExperimental: model.isExperimental,
        description: model.description
      });
      console.log(`Created demo model: ${model.name}`);
    } catch (error) {
      console.error(`Error creating demo model ${model.name}:`, error);
    }
  }
}

// Simulate training progress updates for demo models
async function updateDemoModels() {
  console.log('Updating demo models...');
  const models = await storage.getModels();
  const demoModels = models.filter(m => m.isDemo && m.status === 'training');

  for (const model of demoModels) {
    try {
      // Randomly increment progress between 1-5%
      const progressIncrement = Math.floor(Math.random() * 5) + 1;
      const newProgress = Math.min(100, model.progress + progressIncrement);

      // Update accuracy as training progresses
      const accuracyIncrement = Math.random() * 2;
      const newAccuracy = Math.min(95, model.accuracy + accuracyIncrement);

      // Update epochs
      const newEpochs = model.trainingData.epochsCompleted + 1;

      // Decrease loss rate as training progresses
      const newLossRate = Math.max(0.01, model.trainingData.lossRate * 0.95);

      await storage.updateModel(model.id, {
        progress: newProgress,
        accuracy: Math.round(newAccuracy),
        status: newProgress === 100 ? 'complete' : 'training',
        trainingData: {
          ...model.trainingData,
          epochsCompleted: newEpochs,
          lossRate: newLossRate,
          lastUpdated: new Date().toISOString()
        }
      });

      console.log(`Updated demo model ${model.name}: progress=${newProgress}%, accuracy=${newAccuracy.toFixed(1)}%`);
    } catch (error) {
      console.error(`Error updating demo model ${model.name}:`, error);
    }
  }
}

// Define regions enum for our East-West-NULL_ISLAND architecture
enum REGIONS {
    EAST = 'east',
    WEST = 'west',
    NULL_ISLAND = 'null_island'
}

// Only declare isUpdating once at the module level
let isUpdating = false;

async function updateModelsFromSources() {
  if (isUpdating) {
    console.log('Model update already in progress, skipping...');
    return;
  }

  isUpdating = true;
  console.log('Starting model update from external sources...');

  try {
    for (const model of FEATURED_MODELS) {
      try {
        console.log(`Processing model: ${model.name} from ${model.platform}`);

        // Fetch model info
        const modelInfo = model.platform === 'huggingface'
          ? await fetchHuggingFaceModelInfo(model.repo)
          : await fetchGitHubModelInfo(model.repo);

        if (!modelInfo) {
          console.log(`Skipping ${model.name} - failed to fetch info`);
          continue;
        }

        // Generate analysis using AI
        const analysis = await generateModelAnalysis(modelInfo, model);
        if (!analysis) {
          console.log(`Skipping ${model.name} - failed to generate analysis`);
          continue;
        }

        // Find or create model in database
        const existingModel = await storage.getModelByName(model.name);

        // Determine region based on partner organization affiliations
        let region;

        // Models from specific partners
        if (model.repo.startsWith('microsoft/') || 
            model.repo.startsWith('openai/') || 
            model.repo.startsWith('nvidia/') || 
            model.name === 'GPT-4o' || 
            model.name === 'DALL-E 3' || 
            model.name === 'NeMo-Megatron' || 
            model.name === 'Picasso' || 
            model.name === 'Florence-2' || 
            model.name === 'PHI-3') {
          region = REGIONS.WEST; // Microsoft, OpenAI, NVIDIA are West region partners
        } 
        else if (model.repo.startsWith('sony-ai/') || 
                model.repo.startsWith('thunlp/') || 
                model.repo.startsWith('samsung-research/') || 
                model.name === 'GT-Vision' || 
                model.name === 'MusicLM-Sony' || 
                model.name === 'GLM-4' || 
                model.name === 'CPM-Bee' || 
                model.name === 'Edge-LLM' || 
                model.name === 'NeuralNANO') {
          region = REGIONS.EAST; // Sony, Tsinghua, Samsung are East region partners
        }
        else if (model.repo.startsWith('ibm-quantum/') || 
                model.repo.startsWith('deepmind/') || 
                model.name === 'QuantumNLP' || 
                model.name === 'QiskitVision' || 
                model.name === 'Gemini Pro' || 
                model.name === 'AlphaFold 3' || 
                model.isExperimental || 
                model.task === 'brain-simulation' || 
                model.task === 'generative-modeling' || 
                model.task === 'quantum-enhanced' || 
                model.name.includes('Ninja') || 
                model.name.includes('Pirate') || 
                model.name.includes('Quantum')) {
          region = REGIONS.NULL_ISLAND; // IBM Quantum, DeepMind and experimental models
        } 
        else if (model.name.charAt(0).toLowerCase() < 'n') {
          // Default fallback: A-M go to East
          region = REGIONS.EAST;
        } 
        else {
          // Default fallback: N-Z go to West
          region = REGIONS.WEST;
        }

        const modelData = {
          name: model.name,
          status: analysis.status,
          progress: analysis.progress,
          accuracy: analysis.accuracy,
          nodeId: existingModel?.nodeId || Math.floor(Math.random() * 10) + 1,
          region: existingModel?.region || region, // Keep existing region if available, otherwise assign new one
          trainingData: {
            datasetSize: analysis.datasetSize,
            epochsCompleted: analysis.epochs,
            lossRate: analysis.lossRate,
            modelType: model.type,
            task: model.task,
            sourceRepo: model.repo,
            sourcePlatform: model.platform,
            lastUpdated: new Date().toISOString()
          },
          isExperimental: model.isExperimental,
          description: model.description
        };

        if (existingModel) {
          await storage.updateModel(existingModel.id, modelData);
          console.log(`Updated model: ${model.name} in region ${region}`);
        } else {
          await storage.createModel(modelData);
          console.log(`Created new model: ${model.name} in region ${region}`);
        }

        // Rate limiting pause between models
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error updating model ${model.name}:`, error);
        continue;
      }
    }
  } finally {
    isUpdating = false;
    console.log('Completed model update from external sources');
  }
}

// Initialize demo models and start regular updates
setTimeout(async () => {
  console.log('Initializing model aggregator service...');
  await createDemoModels();
  updateModelsFromSources().catch(console.error);
  updateDemoModels().catch(console.error); //Added to run immediately after demo creation
}, 5000); // Wait 5 seconds after server start

// Regular updates for both featured and demo models
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes for featured models
const DEMO_UPDATE_INTERVAL = 30 * 1000; // 30 seconds for demo models

setInterval(() => {
  updateModelsFromSources().catch(console.error);
}, UPDATE_INTERVAL);

setInterval(() => {
  updateDemoModels().catch(console.error);
}, DEMO_UPDATE_INTERVAL);