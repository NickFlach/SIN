# Example script for using Transformer-NLP
import torch
from transformers import AutoModel, AutoTokenizer

# Load model
model_name = "transformer-nlp"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Example usage
text = "Example input for AI task"
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)

# Process outputs
print(f"Input: {text}")
print(f"Model output shape: {outputs.last_hidden_state.shape}")
print("Processing complete!")
