const prisma = require('../config/db');

exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, status, course, page = 1, limit = 9 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (course) {
      where.course = { contains: course, mode: 'insensitive' };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: students,
      message: 'Students fetched successfully',
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student fetched successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, gender, course, enrollment_year, status } = req.body;

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'A student with this email already exists',
      });
    }

    if (phone) {
      const phoneExists = await prisma.student.findUnique({ where: { phone } });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          data: null,
          message: 'A student with this phone number already exists',
        });
      }
    }

    const student = await prisma.student.create({
      data: {
        firstName: first_name,
        lastName: last_name,
        email,
        phone: phone || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        course,
        enrollmentYear: enrollment_year,
        status: status || 'active',
      },
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, date_of_birth, gender, course, enrollment_year, status } = req.body;

    const existing = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Student not found',
      });
    }

    const emailCheck = await prisma.student.findFirst({
      where: { email, id: { not: parseInt(id) } },
    });
    if (emailCheck) {
      return res.status(409).json({
        success: false,
        data: null,
        message: 'A student with this email already exists',
      });
    }

    if (phone) {
      const phoneCheck = await prisma.student.findFirst({
        where: { phone, id: { not: parseInt(id) } },
      });
      if (phoneCheck) {
        return res.status(409).json({
          success: false,
          data: null,
          message: 'A student with this phone number already exists',
        });
      }
    }

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        firstName: first_name,
        lastName: last_name,
        email,
        phone: phone || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        course,
        enrollmentYear: enrollment_year,
        status: status || 'active',
      },
    });

    res.status(200).json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Student not found',
      });
    }

    await prisma.student.delete({ where: { id: parseInt(id) } });

    res.status(200).json({
      success: true,
      data: existing,
      message: 'Student deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
