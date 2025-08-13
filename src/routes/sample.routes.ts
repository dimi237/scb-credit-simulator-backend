import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { MongoService } from '../services/mongo.service';

export function initSampleRoutes(app: express.Application, mongoService: MongoService): void {
      // Health check route
        app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'OK', timestamp: new Date().toISOString() });
        });

        // Get all sample data
        app.get('/api/data', async (req: Request, res: Response) => {
            try {
                const collection = mongoService.getCollection();
                const data = await collection.find({}).toArray();

                const response: ApiResponse<SampleData[]> = {
                    success: true,
                    data: data
                };

                res.json(response);
            } catch (error) {
                console.error('Error fetching data:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to fetch data'
                };
                res.status(500).json(response);
            }
        });

        // Get single item by ID
        app.get('/api/data/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const collection = mongoService.getCollection();
                const data = await collection.findOne({ _id: new ObjectId(id) });

                if (!data) {
                    const response: ApiResponse<null> = {
                        success: false,
                        message: 'Data not found'
                    };
                    return res.status(404).json(response);
                }

                const response: ApiResponse<SampleData> = {
                    success: true,
                    data: data
                };

                res.json(response);
            } catch (error) {
                console.error('Error fetching data by ID:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to fetch data'
                };
                res.status(500).json(response);
            }
        });

        // Create new sample data
        app.post('/api/data', async (req: Request, res: Response) => {
            try {
     
                const newData: Omit<SampleData, '_id'> = {
                    ...req.body,
                    createdAt: new Date()
                };

                const collection = mongoService.getCollection();
                const result = await collection.insertOne(newData);

                const response: ApiResponse<{ id: string }> = {
                    success: true,
                    data: { id: result.insertedId.toString() },
                    message: 'Data created successfully'
                };

                res.status(201).json(response);
            } catch (error) {
                console.error('Error creating data:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to create data'
                };
                res.status(500).json(response);
            }
        });

        // Update sample data
        app.put('/api/data/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const { name, email, age } = req.body;

                const updateData: Partial<SampleData> = {};
                if (name) updateData.name = name;
                if (email) updateData.email = email;
                if (age) updateData.age = parseInt(age);

                const collection = mongoService.getCollection();
                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    const response: ApiResponse<null> = {
                        success: false,
                        message: 'Data not found'
                    };
                    return res.status(404).json(response);
                }

                const response: ApiResponse<null> = {
                    success: true,
                    message: 'Data updated successfully'
                };

                res.json(response);
            } catch (error) {
                console.error('Error updating data:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to update data'
                };
                res.status(500).json(response);
            }
        });

        // Delete sample data
        app.delete('/api/data/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const collection = mongoService.getCollection();
                const result = await collection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    const response: ApiResponse<null> = {
                        success: false,
                        message: 'Data not found'
                    };
                    return res.status(404).json(response);
                }

                const response: ApiResponse<null> = {
                    success: true,
                    message: 'Data deleted successfully'
                };

                res.json(response);
            } catch (error) {
                console.error('Error deleting data:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to delete data'
                };
                res.status(500).json(response);
            }
        });

        // Seed sample data
        app.post('/api/seed', async (req: Request, res: Response) => {
            try {
                const sampleData: Omit<SampleData, '_id'>[] = [
                    {
                        name: 'John Doe',
                        email: 'john@example.com',
                        age: 30,
                        createdAt: new Date()
                    },
                    {
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        age: 25,
                        createdAt: new Date()
                    },
                    {
                        name: 'Bob Johnson',
                        email: 'bob@example.com',
                        age: 35,
                        createdAt: new Date()
                    }
                ];

                const collection = mongoService.getCollection();
                const result = await collection.insertMany(sampleData);

                const response: ApiResponse<{ insertedCount: number }> = {
                    success: true,
                    data: { insertedCount: result.insertedCount },
                    message: 'Sample data seeded successfully'
                };

                res.status(201).json(response);
            } catch (error) {
                console.error('Error seeding data:', error);
                const response: ApiResponse<null> = {
                    success: false,
                    message: 'Failed to seed data'
                };
                res.status(500).json(response);
            }
        });
}