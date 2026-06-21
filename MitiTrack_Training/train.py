import os
import pandas as pd
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm

# 1. Configuration & Hyperparameters
CSV_FILE = 'train_classes.csv'  # Path to the Kaggle dataset CSV
IMAGE_DIR = 'train-jpg'         # Path to the unzipped images folder
BATCH_SIZE = 32
LEARNING_RATE = 1e-4
EPOCHS = 10
NUM_CLASSES = 17                # The Amazon dataset has 17 unique tags
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# All 17 tags from the Kaggle Amazon dataset
TAGS = [
    'agriculture', 'artisanal_mine', 'bare_ground', 'blooming', 
    'blow_down', 'clear', 'cloudy', 'conventional_mine', 'cultivation', 
    'habitation', 'haze', 'partly_cloudy', 'primary', 'road', 
    'selective_logging', 'slash_burn', 'water'
]

# Create a mapping from tag name to integer ID
TAG_TO_IDX = {tag: i for i, tag in enumerate(TAGS)}

# 2. Custom Dataset Class
class AmazonDataset(Dataset):
    def __init__(self, csv_file, img_dir, transform=None):
        """
        Args:
            csv_file (string): Path to the csv file with annotations.
            img_dir (string): Directory with all the images.
            transform (callable, optional): Optional transform to be applied on a sample.
        """
        self.df = pd.read_csv(csv_file)
        self.img_dir = img_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        # Read the image name (e.g., 'train_0') and add '.jpg'
        img_name = self.df.iloc[idx, 0] + '.jpg'
        img_path = os.path.join(self.img_dir, img_name)
        
        # Load image
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
            
        # Parse the space-separated tags (e.g., 'primary clear water')
        tags = self.df.iloc[idx, 1].split(' ')
        
        # Create a one-hot encoded label tensor
        label = torch.zeros(NUM_CLASSES)
        for tag in tags:
            if tag in TAG_TO_IDX:
                label[TAG_TO_IDX[tag]] = 1.0
                
        return image, label

# 3. Model Definition
def get_model(num_classes):
    # Load a pre-trained ResNet50 model
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    
    # Replace the final fully connected layer to output 'num_classes' instead of 1000
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    
    return model

# 4. Training Loop
def train():
    print(f"Using device: {DEVICE}")

    # Transforms for data augmentation and normalization
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ToTensor(),
        # Standard normalization for pre-trained ImageNet models
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                             std=[0.229, 0.224, 0.225])
    ])

    # Check if dataset files exist before trying to load
    if not os.path.exists(CSV_FILE) or not os.path.exists(IMAGE_DIR):
        print(f"ERROR: Dataset not found.")
        print(f"Please ensure '{CSV_FILE}' and '{IMAGE_DIR}/' are in the same directory.")
        print("You can download the dataset from Kaggle: https://www.kaggle.com/c/planet-understanding-the-amazon-from-space/data")
        return

    # Load dataset and dataloader
    dataset = AmazonDataset(csv_file=CSV_FILE, img_dir=IMAGE_DIR, transform=transform)
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)

    # Initialize model, loss function, and optimizer
    model = get_model(NUM_CLASSES).to(DEVICE)
    
    # For multi-label classification, BCEWithLogitsLoss is the standard loss function
    # It applies a Sigmoid activation internally before computing Binary Cross Entropy
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print("Starting training...")
    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        
        # Progress bar for the batches
        loop = tqdm(dataloader, leave=True)
        for images, labels in loop:
            images, labels = images.to(DEVICE), labels.to(DEVICE)

            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)

            # Backward pass and optimization
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            # Update progress bar
            running_loss += loss.item()
            loop.set_description(f"Epoch [{epoch+1}/{EPOCHS}]")
            loop.set_postfix(loss=loss.item())

        epoch_loss = running_loss / len(dataloader)
        print(f"Epoch {epoch+1} completed. Average Loss: {epoch_loss:.4f}\n")

    print("Training finished!")
    
    # Save the trained model
    torch.save(model.state_dict(), 'amazon_satellite_model.pth')
    print("Model saved as 'amazon_satellite_model.pth'")

if __name__ == '__main__':
    train()
