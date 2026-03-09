import { prisma } from '../config/db.js';
// Create a new department
export const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }
        const existingDepartment = await prisma.department.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });
        if (existingDepartment) {
            return res.status(400).json({ error: 'Department with this name already exists' });
        }
        const department = await prisma.department.create({
            data: {
                name,
                description,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        empId: true,
                    }
                }
            }
        });
        res.status(201).json(department);
    }
    catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
};
// Get all departments
export const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            where: { isActive: true },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        empId: true,
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};
// Get department by ID
export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        empId: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json(department);
    }
    catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
};
// Update department
export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const existingDepartment = await prisma.department.findUnique({
            where: { id }
        });
        if (!existingDepartment) {
            return res.status(404).json({ error: 'Department not found' });
        }
        if (name && name !== existingDepartment.name) {
            const duplicateDepartment = await prisma.department.findFirst({
                where: {
                    name: { equals: name, mode: 'insensitive' },
                    id: { not: id }
                }
            });
            if (duplicateDepartment) {
                return res.status(400).json({ error: 'Department with this name already exists' });
            }
        }
        const updatedDepartment = await prisma.department.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        empId: true,
                    }
                }
            }
        });
        res.json(updatedDepartment);
    }
    catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
};
// Delete department (soft delete)
export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                users: true
            }
        });
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        if (department.users.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete department with assigned employees. Please reassign employees first.'
            });
        }
        await prisma.department.update({
            where: { id },
            data: { isActive: false }
        });
        res.json({ message: 'Department deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
};
// Assign employee to department
export const assignEmployeeToDepartment = async (req, res) => {
    try {
        const { userId, departmentId } = req.body;
        if (!userId || !departmentId) {
            return res.status(400).json({ error: 'User ID and Department ID are required' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { departmentId },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error assigning employee to department:', error);
        res.status(500).json({ error: 'Failed to assign employee to department' });
    }
};
// Remove employee from department
export const removeEmployeeFromDepartment = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { departmentId: null }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error removing employee from department:', error);
        res.status(500).json({ error: 'Failed to remove employee from department' });
    }
};
// Get employees without department
export const getEmployeesWithoutDepartment = async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            where: {
                departmentId: null,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                empId: true,
                role: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(employees);
    }
    catch (error) {
        console.error('Error fetching employees without department:', error);
        res.status(500).json({ error: 'Failed to fetch employees without department' });
    }
};
//# sourceMappingURL=department.controller.js.map