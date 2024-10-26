import React, { useEffect, useRef, useState } from "react";
import { Form, DatePicker, Button, Card, Select, message, Tour } from "antd";
import {
	useSearchClinicOfficeLazyQuery,
	useSearchClinicDoctorLazyQuery,
	useSearchClinicLazyQuery,
	useSearchClinicDoctorAvailabilityLazyQuery,
	useCreateClinicTableMutation,
} from "@/shared/__generate/graphql-frontend";
import { useUserStore } from "@/entities/User";
import { TourProps } from "antd/lib";

interface FormValues {
	beginDate?: Date;
	clinicId?: string;
	doctorId?: string;
	officeId?: string;
}

const AppointmentForm: React.FC = () => {
	const [isTourOpen, setIsTourOpen] = useState<boolean>(!localStorage.getItem("isPersonWasOnClientPage"));
	const ref1 = useRef<HTMLDivElement | null>(null);
	const ref2 = useRef<HTMLDivElement | null>(null);
	const ref3 = useRef<HTMLDivElement | null>(null);
	const ref4 = useRef<HTMLDivElement | null>(null);
	const ref5 = useRef<HTMLButtonElement | null>(null);

	const steps: TourProps["steps"] = [
		{
			title: "Клиника",
			nextButtonProps: { children: "Дальше" },
			prevButtonProps: { children: "Назад" },
			description: "Выберите клинику, в которой хотите получить помощь",
			target: () => ref1.current!,
		},
		{
			title: "Кабинет",
			nextButtonProps: { children: "Дальше" },
			prevButtonProps: { children: "Назад" },
			description: "После выбора клиники можно выбрать кабинет врача...",
			target: () => ref2.current!,
		},
		{
			title: "Доктор",
			nextButtonProps: { children: "Дальше" },
			prevButtonProps: { children: "Назад" },
			description: "...а также самого врача",
			target: () => ref3.current!,
		},
		{
			title: "Дата и время визита",
			nextButtonProps: { children: "Дальше" },
			prevButtonProps: { children: "Назад" },
			description: "Последним этапом выбираете дату и время приема",
			target: () => ref4.current!,
		},
		{
			title: "Завершить",
			nextButtonProps: { children: "Дальше" },
			prevButtonProps: { children: "Назад" },
			description: "Ура! Ваше заявление принято и мы ждем вас в нашей клинике!",
			target: () => {
				localStorage.setItem("isPersonWasOnClientPage", "true");
				return ref5.current!;
			},
		},
	];

	const [{ clinicId, doctorId, officeId, beginDate }, setForm] = useState<FormValues>({});
	const [messageApi, contextHolder] = message.useMessage();
	const { user } = useUserStore();
	const [clinics, setClinics] = useState<Array<{ __typename: "_E_Clinic"; id: string; name?: string | null }>>([]);
	const [clinicOffices, setClinicOffices] = useState<
		Array<{
			__typename: "_E_ClinicOffice";
			id: string;
			officeNumber?: string | null;
			clinic: { __typename?: "_E_Clinic"; id: string; name?: string | null };
		}>
	>([]);
	const [clinicDoctors, setClinicDoctors] = useState<
		Array<{
			__typename: "_E_ClinicDoctor";
			id: string;
			clinic: { __typename?: "_E_Clinic"; id: string; name?: string | null };
			doctor: {
				__typename?: "_G_DoctorReference";
				entityId?: string | null;
				entity?: {
					__typename?: "_E_Doctor";
					doctorType: { __typename?: "_E_DoctorType"; id: string; name: string };
					person: {
						__typename?: "_G_PersonReference";
						entityId?: string | null;
						entity?: {
							__typename?: "_E_Person";
							firstName: string;
							lastName: string;
							inn?: string | null;
							birthDate?: unknown | null;
						} | null;
					};
				} | null;
			};
		}>
	>([]);
	const [avaiblity, setAvaiblity] = useState<
		Array<{
			__typename: "_E_ClinicDoctorAvailability";
			id: string;
			beginDate: unknown;
			endDate: unknown;
			clinicOffice: { __typename?: "_E_ClinicOffice"; id: string; officeNumber?: string | null };
		}>
	>([]);

	const [createAppointment, { loading: AppoinmentLoading }] = useCreateClinicTableMutation();
	const [searchClinic, { loading: clinicsLoading }] = useSearchClinicLazyQuery();
	const [searchOffice, { loading: officesLoading }] = useSearchClinicOfficeLazyQuery();
	const [searchDoctor, { loading: doctorsLoading }] = useSearchClinicDoctorLazyQuery();
	const [searchAvaiblity, { loading: avaiblityLoading }] = useSearchClinicDoctorAvailabilityLazyQuery();
	console.log(clinicId, doctorId, officeId, avaiblity);

	const showSuccess = () => {
		messageApi.success("Запись прошла успешно!");
	};

	// Clinic
	useEffect(() => {
		const getData = async () => {
			const { data } = await searchClinic({
				variables: { searchStr: "" },
			});
			setClinics(data?.searchClinic.elems || []);
			setForm((prev) => ({ ...prev, doctorId: undefined, officeId: undefined, appointment: undefined }));
		};
		getData();
	}, []);

	// Offices
	useEffect(() => {
		const getData = async () => {
			const { data } = await searchOffice({
				variables: { clinicId: clinicId || "", officeNumber: "" },
			});
			setClinicOffices(data?.searchClinicOffice.elems || []);
			setForm((prev) => ({ ...prev, doctorId: undefined, appointment: undefined }));
		};
		getData();
	}, [clinicId]);

	// Doctor
	useEffect(() => {
		const getData = async () => {
			const { data } = await searchDoctor({
				variables: { clinicId: clinicId || "", searchStr: "" },
			});
			setClinicDoctors(data?.searchClinicDoctor.elems || []);
			setForm((prev) => ({ ...prev, appointment: undefined }));
		};
		getData();
	}, [clinicId]);

	// Avaible
	useEffect(() => {
		const getData = async () => {
			const fromDate = new Date();
			const toDate = new Date();
			fromDate.setFullYear(new Date().getFullYear() - 1);
			toDate.setFullYear(new Date().getFullYear() + 1);

			const { data } = await searchAvaiblity({
				variables: {
					clinicDoctorId: doctorId || "",
					dateFrom: fromDate.toISOString().slice(0, -1),
					dateTo: toDate.toISOString().slice(0, -1),
				},
			});
			setAvaiblity(data?.searchClinicDoctorAvailability.elems || []);
		};
		getData();
	}, [clinicId, doctorId, officeId]);

	const onFinish = async () => {
		const beginDate = new Date();
		const endDate = new Date();
		endDate.setMinutes(beginDate.getMinutes() + 15);
		createAppointment({
			variables: {
				beginDate: beginDate.toISOString().slice(0, -1),
				endDate: endDate.toISOString().slice(0, -1),
				clinicId: clinicId || "",
				clinicDoctorId: doctorId || "",
				clinicOfficeId: officeId || "",
				customerId: user?.id || "",
			},
		});
		showSuccess();
	};

	return (
		<Card title="Запись на прием">
			{contextHolder}
			<Tour open={isTourOpen} onClose={() => setIsTourOpen(false)} steps={steps} />
			<div ref={ref1}>
				<Form.Item label="Клиника" name="clinicId" rules={[{ required: true, message: "Выберите клинику" }]}>
					<Select
						size="large"
						loading={clinicsLoading}
						placeholder="Выберите клинику"
						options={clinics.map((clinic) => ({
							label: clinic.name,
							value: clinic.id,
						}))}
						onChange={(clinicId) => setForm((prev) => ({ ...prev, clinicId }))}
					/>
				</Form.Item>
			</div>
			<div ref={ref2}>
				<Form.Item label="Кабинет" name="officeId" rules={[{ required: true, message: "Выберите кабинет" }]}>
					<Select
						size="large"
						disabled={!clinicId}
						loading={officesLoading}
						placeholder="Выберите кабинет"
						options={clinicOffices.map((office) => ({
							label: `Кабинет ${office.officeNumber}`,
							value: office.id,
						}))}
						onChange={(officeId) => setForm((prev) => ({ ...prev, officeId }))}
					/>
				</Form.Item>
			</div>
			<div ref={ref3}>
				<Form.Item label="Доктор" name="doctorId" rules={[{ required: true, message: "Выберите доктора" }]}>
					<Select
						size="large"
						disabled={!officeId}
						loading={doctorsLoading}
						placeholder="Выберите доктора"
						options={clinicDoctors.map((doctor) => ({
							label: `${doctor.doctor.entity?.person.entity?.firstName} ${doctor.doctor.entity?.person.entity?.lastName}`,
							value: doctor.id,
						}))}
						onChange={(doctorId) => setForm((prev) => ({ ...prev, doctorId }))}
					/>
				</Form.Item>
			</div>
			<div ref={ref4}>
				<Form.Item
					label="Дата и время визита"
					name="appointment"
					rules={[{ required: true, message: "Выберите дату и время" }]}
				>
					<DatePicker
						className="w-full"
						size="large"
						value={beginDate}
						onChange={(date) => setForm((prev) => ({ ...prev, beginDate: date }))}
						disabled={!doctorId || avaiblityLoading}
						showTime
					/>
				</Form.Item>
			</div>
			<Form.Item>
				<Button
					ref={ref5}
					size="large"
					className="w-full"
					loading={AppoinmentLoading}
					onClick={onFinish}
					type="primary"
					htmlType="submit"
				>
					Записаться
				</Button>
			</Form.Item>
		</Card>
	);
};

export default AppointmentForm;
