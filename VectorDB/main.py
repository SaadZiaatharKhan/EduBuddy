import os
import pickle
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

load_dotenv()

# Set paths
TEXTBOOKS_DIR = "TextBooks"
VECTOR_DB_DIR = "vector_db"
CHECKPOINT_FILE = "processed_documents.pkl"
PROCESSED_FILES_FILE = "processed_files.pkl"

# Initialize Google Gemini Embeddings (update model name and ensure proper API keys are set)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

# Create vector DB directory if it doesn't exist
if not os.path.exists(VECTOR_DB_DIR):
    os.makedirs(VECTOR_DB_DIR)

# Load checkpoint if exists
if os.path.exists(CHECKPOINT_FILE):
    with open(CHECKPOINT_FILE, 'rb') as f:
        documents = pickle.load(f)
else:
    documents = []

# Load list of processed files if exists
if os.path.exists(PROCESSED_FILES_FILE):
    with open(PROCESSED_FILES_FILE, 'rb') as f:
        processed_files = pickle.load(f)
else:
    processed_files = set()

def process_pdf(file_path, metadata):
    print(f"Processing: {file_path}")
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    for chunk in chunks:
        chunk.metadata.update(metadata)
    return chunks

# Traverse the TextBooks directory recursively.
for class_folder in os.listdir(TEXTBOOKS_DIR):
    class_path = os.path.join(TEXTBOOKS_DIR, class_folder)
    if os.path.isdir(class_path):
        for subject_folder in os.listdir(class_path):
            subject_path = os.path.join(class_path, subject_folder)
            if os.path.isdir(subject_path):
                sub_items = os.listdir(subject_path)
                has_subsubject = any(os.path.isdir(os.path.join(subject_path, item)) for item in sub_items)
                if has_subsubject:
                    for sub_subject in os.listdir(subject_path):
                        sub_subject_path = os.path.join(subject_path, sub_subject)
                        if os.path.isdir(sub_subject_path):
                            for pdf_file in os.listdir(sub_subject_path):
                                if pdf_file.lower().endswith(".pdf"):
                                    file_path = os.path.join(sub_subject_path, pdf_file)
                                    # Skip file if already processed
                                    if file_path in processed_files:
                                        continue
                                    metadata = {
                                        "class": class_folder,
                                        "subject": subject_folder,
                                        "sub_subject": sub_subject,
                                        "file": pdf_file,
                                        "page": "Unknown"
                                    }
                                    try:
                                        chunks = process_pdf(file_path, metadata)
                                        documents.extend(chunks)
                                        processed_files.add(file_path)
                                        # Update checkpoint files after each successful processing
                                        with open(CHECKPOINT_FILE, 'wb') as f:
                                            pickle.dump(documents, f)
                                        with open(PROCESSED_FILES_FILE, 'wb') as f:
                                            pickle.dump(processed_files, f)
                                    except Exception as e:
                                        print(f"Error processing {file_path}: {e}")
                else:
                    for book_folder in os.listdir(subject_path):
                        book_path = os.path.join(subject_path, book_folder)
                        if os.path.isdir(book_path):
                            for pdf_file in os.listdir(book_path):
                                if pdf_file.lower().endswith(".pdf"):
                                    file_path = os.path.join(book_path, pdf_file)
                                    if file_path in processed_files:
                                        continue
                                    metadata = {
                                        "class": class_folder,
                                        "subject": subject_folder,
                                        "book": book_folder,
                                        "file": pdf_file,
                                        "page": "Unknown"
                                    }
                                    try:
                                        chunks = process_pdf(file_path, metadata)
                                        documents.extend(chunks)
                                        processed_files.add(file_path)
                                        with open(CHECKPOINT_FILE, 'wb') as f:
                                            pickle.dump(documents, f)
                                        with open(PROCESSED_FILES_FILE, 'wb') as f:
                                            pickle.dump(processed_files, f)
                                    except Exception as e:
                                        print(f"Error processing {file_path}: {e}")
                        elif book_folder.lower().endswith(".pdf"):
                            file_path = os.path.join(subject_path, book_folder)
                            if file_path in processed_files:
                                continue
                            metadata = {
                                "class": class_folder,
                                "subject": subject_folder,
                                "file": book_folder,
                                "page": "Unknown"
                            }
                            try:
                                chunks = process_pdf(file_path, metadata)
                                documents.extend(chunks)
                                processed_files.add(file_path)
                                with open(CHECKPOINT_FILE, 'wb') as f:
                                    pickle.dump(documents, f)
                                with open(PROCESSED_FILES_FILE, 'wb') as f:
                                    pickle.dump(processed_files, f)
                            except Exception as e:
                                print(f"Error processing {file_path}: {e}")

print("Creating Vector Database...")
vectorstore = Chroma.from_documents(documents, embeddings, persist_directory=VECTOR_DB_DIR)
vectorstore.persist()
print(f"Vector Database stored in {VECTOR_DB_DIR}")
