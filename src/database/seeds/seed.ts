import { Author } from '../../modules/author/entities/author.entity';
import { Book, GenreEnum } from '../../modules/book/entities/book.entity';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../common/enums/userRole.enum';
import * as bcrypt from 'bcrypt';
import dataSource from '../../config/orm.config';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseSeeder');

const authorsData = [
  {
    name: 'J.K. Rowling',
    bio: 'British author, best known for the Harry Potter fantasy series, which has won multiple awards and sold more than 500 million copies, becoming the best-selling book series in history.',
  },
  {
    name: 'George R.R. Martin',
    bio: 'American novelist and short-story writer in the fantasy, horror, and science fiction genres, best known for his series of epic fantasy novels, A Song of Ice and Fire.',
  },
  {
    name: 'Stephen King',
    bio: 'American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels. His books have sold more than 350 million copies.',
  },
  {
    name: 'Agatha Christie',
    bio: 'English writer known for her 66 detective novels and 14 short story collections, particularly those revolving around fictional detectives Hercule Poirot and Miss Marple.',
  },
  {
    name: 'Isaac Asimov',
    bio: 'American writer and professor of biochemistry at Boston University. He was known for his works of science fiction and popular science.',
  },
  {
    name: 'Toni Morrison',
    bio: 'American novelist, essayist, book editor, and college professor. Her first novel, The Bluest Eye, was published in 1970. She won the Nobel Prize in Literature in 1993.',
  },
  {
    name: 'Harper Lee',
    bio: 'American novelist best known for her 1960 novel To Kill a Mockingbird. It won the 1961 Pulitzer Prize and has become a classic of modern American literature.',
  },
  {
    name: 'Ernest Hemingway',
    bio: 'American novelist, short-story writer, and journalist. His economical and understated style had a strong influence on 20th-century fiction.',
  },
];

const defaultUserData = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'admin123',
  status: true,
  role: Role.MODERATOR,
};

const bookTitles = [
  { title: 'The Great Adventure', genre: GenreEnum.FICTION, year: 2020 },
  { title: 'Mystery of the Lost City', genre: GenreEnum.FICTION, year: 2019 },
  { title: 'Love in Paris', genre: GenreEnum.FICTION, year: 2021 },
  { title: 'The Last Warrior', genre: GenreEnum.FICTION, year: 2018 },
  { title: 'Dreams and Reality', genre: GenreEnum.FICTION, year: 2022 },
  { title: 'The Secret Garden', genre: GenreEnum.FICTION, year: 2017 },
  { title: 'Beyond the Horizon', genre: GenreEnum.FICTION, year: 2023 },
  { title: 'The Time Traveler', genre: GenreEnum.FICTION, year: 2016 },
  { title: 'Eternal Love', genre: GenreEnum.FICTION, year: 2024 },
  { title: 'The Hidden Truth', genre: GenreEnum.FICTION, year: 2015 },

  {
    title: 'History of Ancient Civilizations',
    genre: GenreEnum.NON_FICTION,
    year: 2019,
  },
  {
    title: 'Modern Economics Explained',
    genre: GenreEnum.NON_FICTION,
    year: 2021,
  },
  { title: 'The Art of Leadership', genre: GenreEnum.NON_FICTION, year: 2020 },
  {
    title: 'Understanding Psychology',
    genre: GenreEnum.NON_FICTION,
    year: 2022,
  },
  { title: 'Digital Age Revolution', genre: GenreEnum.NON_FICTION, year: 2023 },
  {
    title: 'Climate Change Solutions',
    genre: GenreEnum.NON_FICTION,
    year: 2021,
  },
  { title: 'The Future of Work', genre: GenreEnum.NON_FICTION, year: 2024 },
  { title: 'Social Media Impact', genre: GenreEnum.NON_FICTION, year: 2020 },
  {
    title: 'Health and Wellness Guide',
    genre: GenreEnum.NON_FICTION,
    year: 2022,
  },
  {
    title: 'Financial Planning Basics',
    genre: GenreEnum.NON_FICTION,
    year: 2019,
  },

  {
    title: 'Quantum Physics for Beginners',
    genre: GenreEnum.SCIENCE,
    year: 2021,
  },
  { title: 'The Human Genome Project', genre: GenreEnum.SCIENCE, year: 2020 },
  { title: 'Space Exploration Today', genre: GenreEnum.SCIENCE, year: 2023 },
  {
    title: 'Artificial Intelligence Revolution',
    genre: GenreEnum.SCIENCE,
    year: 2022,
  },
  {
    title: 'Renewable Energy Technologies',
    genre: GenreEnum.SCIENCE,
    year: 2021,
  },
  { title: 'Marine Biology Discoveries', genre: GenreEnum.SCIENCE, year: 2024 },
  { title: 'Neuroscience Breakthroughs', genre: GenreEnum.SCIENCE, year: 2020 },
  { title: 'Climate Science Research', genre: GenreEnum.SCIENCE, year: 2023 },
  { title: 'Robotics and Automation', genre: GenreEnum.SCIENCE, year: 2022 },
  { title: 'Biotechnology Advances', genre: GenreEnum.SCIENCE, year: 2021 },

  { title: 'World War II Chronicles', genre: GenreEnum.HISTORY, year: 2019 },
  { title: 'Ancient Rome Empire', genre: GenreEnum.HISTORY, year: 2020 },
  { title: 'The Renaissance Period', genre: GenreEnum.HISTORY, year: 2021 },
  { title: 'Medieval Europe', genre: GenreEnum.HISTORY, year: 2018 },
  { title: 'American Revolution', genre: GenreEnum.HISTORY, year: 2022 },
  {
    title: 'Industrial Revolution Impact',
    genre: GenreEnum.HISTORY,
    year: 2020,
  },
  { title: 'Cold War Era', genre: GenreEnum.HISTORY, year: 2023 },
  { title: 'Ancient Egypt Civilization', genre: GenreEnum.HISTORY, year: 2021 },
  { title: 'The Great Depression', genre: GenreEnum.HISTORY, year: 2019 },
  { title: 'Modern History Timeline', genre: GenreEnum.HISTORY, year: 2024 },
];

const titleVariations = [
  'The',
  'A',
  'An',
  'My',
  'Our',
  'Their',
  'His',
  'Her',
  'Adventure',
  'Journey',
  'Story',
  'Tale',
  'Chronicle',
  'Legend',
  'Mystery',
  'Secret',
  'Hidden',
  'Lost',
  'Forgotten',
  'Ancient',
  'Modern',
  'Future',
  'Past',
  'Present',
  'Eternal',
  'Timeless',
  'Love',
  'War',
  'Peace',
  'Hope',
  'Dream',
  'Reality',
  'Truth',
  'Light',
  'Dark',
  'Fire',
  'Water',
  'Earth',
  'Sky',
  'Star',
  'Moon',
  'Sun',
  'Wind',
  'Storm',
  'Rain',
  'Snow',
  'Ice',
  'Mountain',
  'River',
  'Ocean',
  'Forest',
  'Desert',
  'City',
  'Village',
  'Castle',
  'Tower',
  'Bridge',
  'Road',
  'Path',
  'Door',
  'Window',
  'Garden',
  'Flower',
  'Tree',
  'Bird',
  'Dragon',
  'Phoenix',
  'Lion',
  'Tiger',
  'Wolf',
  'Eagle',
];

const genreWords = {
  [GenreEnum.FICTION]: [
    'Fantasy',
    'Romance',
    'Thriller',
    'Adventure',
    'Mystery',
    'Drama',
    'Comedy',
    'Horror',
  ],
  [GenreEnum.NON_FICTION]: [
    'Biography',
    'Memoir',
    'Self-Help',
    'Business',
    'Education',
    'Philosophy',
    'Religion',
    'Travel',
  ],
  [GenreEnum.SCIENCE]: [
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics',
    'Astronomy',
    'Geology',
    'Medicine',
    'Technology',
  ],
  [GenreEnum.HISTORY]: [
    'Ancient',
    'Medieval',
    'Modern',
    'Contemporary',
    'Military',
    'Political',
    'Social',
    'Cultural',
  ],
};

function generateRandomTitle(genre: GenreEnum): string {
  const genreWordsList = genreWords[genre];
  const randomGenreWord =
    genreWordsList[Math.floor(Math.random() * genreWordsList.length)];
  const randomWord1 =
    titleVariations[Math.floor(Math.random() * titleVariations.length)];
  const randomWord2 =
    titleVariations[Math.floor(Math.random() * titleVariations.length)];

  return `${randomWord1} ${randomGenreWord} ${randomWord2}`;
}

function generateRandomYear(): number {
  return Math.floor(Math.random() * 25) + 2000;
}

async function seedDatabase() {
  try {
    logger.log('Starting database seeding...');

    await dataSource.initialize();
    logger.log('Database connection established');

    logger.log('Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "books" CASCADE');
    await dataSource.query('TRUNCATE TABLE "authors" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    logger.log('Existing data cleared');

    // Create authors
    logger.log('Creating authors...');
    const authors: Author[] = [];

    for (const authorData of authorsData) {
      const author = dataSource.getRepository(Author).create(authorData);
      const savedAuthor = await dataSource.getRepository(Author).save(author);
      authors.push(savedAuthor);
    }
    logger.log(`Created ${authors.length} authors`);

    logger.log('Creating default user...');
    const hashedPassword = await bcrypt.hash(defaultUserData.password, 10);
    const user = dataSource.getRepository(User).create({
      ...defaultUserData,
      password: hashedPassword,
    });
    await dataSource.getRepository(User).save(user);
    logger.log('Default user created');

    logger.log('Creating books...');
    const books: Book[] = [];

    for (const bookData of bookTitles) {
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const book = dataSource.getRepository(Book).create({
        title: bookData.title,
        genre: bookData.genre,
        publicationYear: bookData.year,
        author: randomAuthor,
        authorName: randomAuthor.name,
      });
      books.push(book);
    }

    const targetBookCount = 1000;
    const remainingBooks = targetBookCount - bookTitles.length;

    for (let i = 0; i < remainingBooks; i++) {
      const randomGenre =
        Object.values(GenreEnum)[
          Math.floor(Math.random() * Object.values(GenreEnum).length)
        ];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];

      const book = dataSource.getRepository(Book).create({
        title: generateRandomTitle(randomGenre),
        genre: randomGenre,
        publicationYear: generateRandomYear(),
        author: randomAuthor,
        authorName: randomAuthor.name,
      });
      books.push(book);
    }

    const batchSize = 100;
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      await dataSource.getRepository(Book).save(batch);
    }

    logger.log(`Created ${books.length} books`);

    logger.log('Seeding completed successfully!');
  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
